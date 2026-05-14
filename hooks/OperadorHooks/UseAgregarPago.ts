import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { useAuth } from '../../context/AuthContext';
import { PagosService } from '../../services/PagosService';
import { CuponesService } from '../../services/CuponesService';
import { AuthService } from '../../services/AuthService';
import { obtenerMontoNumerico } from '../../utils/formatters';
import { generarTokenQr } from '../../utils/generators';

export type MetodoPagoCliente = 'tarjeta_qruta' | 'credito' | 'debito';
export type TipoGasolina = 'extra' | 'super' | 'diesel' | 'ecopais';

export type CuponOperador = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: 'monto' | 'porcentaje';
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    expira_en: string | null;
};

export type PagoGenerado = {
    id: string;
    qr_token: string;
    valor: number;
    tipo_gasolina: string;
    metodo_pago: string;
    cupon_codigo: string | null;
    descuento: number;
    total: number;
    estado: string;
    expira_en: string | null;
};

export function useAgregarPago() {
    const { session } = useAuth();

    const [valor, setValor] = useState('');
    const [metodoPago, setMetodoPago] = useState<MetodoPagoCliente>('tarjeta_qruta');
    const [tipoGasolina, setTipoGasolina] = useState<TipoGasolina>('extra');

    const [cupones, setCupones] = useState<CuponOperador[]>([]);
    const [cuponSeleccionado, setCuponSeleccionado] = useState<CuponOperador | null>(null);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [pagoGenerado, setPagoGenerado] = useState<PagoGenerado | null>(null);

    const operadorId = session?.user?.id;

    // (Calculamos todo con useMemo para no recalcular a menos que cambie el valor)
    const valorNumerico = useMemo(() => {
        const numero = obtenerMontoNumerico(valor);
        return Number.isNaN(numero) ? 0 : numero;
    }, [valor]);

    const descuentoCalculado = useMemo(() => {
        if (!cuponSeleccionado || valorNumerico <= 0) return 0;

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0);

        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((valorNumerico * valorDescuento) / 100).toFixed(2));
        }

        return Math.min(valorDescuento, valorNumerico);
    }, [cuponSeleccionado, valorNumerico]);

    const totalCalculado = useMemo(() => {
        return Number(Math.max(valorNumerico - descuentoCalculado, 0).toFixed(2));
    }, [valorNumerico, descuentoCalculado]);

    const cargarCuponesOperador = useCallback(async () => {
        if (!operadorId) return;

        try {
            setLoadingData(true);

            // Traemos los cupones desde nuestro servicio
            const { data, error } = await CuponesService.obtenerCuponesDisponibles(operadorId, 'operador');

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones del operador');
                return;
            }

            // (Filtramos por si alguno ya se venció)
            const cuponesDisponibles = (data || []).filter((cupon) => {
                if (!cupon.expira_en) return true;
                return new Date(cupon.expira_en) >= new Date();
            });

            setCupones(cuponesDisponibles as CuponOperador[]);
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones');
        } finally {
            setLoadingData(false);
        }
    }, [operadorId]);

    useEffect(() => {
        cargarCuponesOperador();
    }, [cargarCuponesOperador]);

    async function generarPagoQr() {
        if (!operadorId) {
            CustomAlert.alert('Error', 'No se pudo obtener el operador actual');
            return;
        }

        if (!valor.trim() || Number.isNaN(valorNumerico) || valorNumerico <= 0) {
            CustomAlert.alert('Valor inválido', 'Ingresa un valor válido mayor a $0.00');
            return;
        }

        if (totalCalculado <= 0) {
            CustomAlert.alert('Total inválido', 'El total a pagar no puede ser $0.00');
            return;
        }

        try {
            setLoading(true);

            // Verificamos a qué gasolinera pertenece usando el servicio de Auth
            const { data: perfilOperador, error: perfilError } = await AuthService.obtenerPerfil(operadorId);

            if (perfilError || !perfilOperador?.gasolinera_id) {
                CustomAlert.alert('Operador sin gasolinera', 'Este operador no tiene una gasolinera asignada');
                return;
            }

            // Usamos nuestro helper de utilidades
            const qrToken = generarTokenQr();

            const expiraEn = new Date();
            expiraEn.setMinutes(expiraEn.getMinutes() + 5);

            const datosPago = {
                qr_token: qrToken,
                operador_id: operadorId,
                cliente_id: null,
                gasolinera_id: perfilOperador.gasolinera_id,
                valor: valorNumerico,
                tipo_gasolina: tipoGasolina,
                metodo_pago: metodoPago,
                cupon_codigo: cuponSeleccionado?.codigo || null,
                descuento: descuentoCalculado,
                total: totalCalculado,
                estado: 'pendiente',
                expira_en: expiraEn.toISOString(),
                pagado_en: null,
            };

            // Delegamos la creación al servicio de pagos
            const { data: pago, error: pagoError } = await PagosService.generarPagoPendiente(datosPago);

            if (pagoError) {
                console.log(pagoError.message);
                CustomAlert.alert('Error', 'No se pudo generar el pago QR');
                return;
            }

            setPagoGenerado(pago as PagoGenerado);
            CustomAlert.alert('QR generado', 'El cliente ya puede escanear este código desde su app');
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al generar el pago QR');
        } finally {
            setLoading(false);
        }
    }

    function crearOtroPago() {
        setValor('');
        setMetodoPago('tarjeta_qruta');
        setTipoGasolina('extra');
        setCuponSeleccionado(null);
        setPagoGenerado(null);
    }

    const qrValue = pagoGenerado
        ? JSON.stringify({ qr_token: pagoGenerado.qr_token })
        : '';

    return {
        valor,
        setValor,
        metodoPago,
        setMetodoPago,
        tipoGasolina,
        setTipoGasolina,
        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,
        valorNumerico,
        descuentoCalculado,
        totalCalculado,
        loading,
        loadingData,
        pagoGenerado,
        qrValue,
        cargarCuponesOperador,
        generarPagoQr,
        crearOtroPago,
    };
}