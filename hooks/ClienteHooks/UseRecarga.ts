import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { BilleteraService } from '../../services/BilleteraService';
import { CuponesService } from '../../services/CuponesService';
import { obtenerMontoNumerico } from '../../utils/formatters';

export type MetodoRecarga = 'credito' | 'debito';

export type MetodoPago = {
    id: string;
    usuario_id: string;
    tipo: MetodoRecarga;
    marca: string | null;
    ultimos_4: string;
    titular: string | null;
    estado: string;
};

export type CuponRecarga = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: 'monto' | 'porcentaje';
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    usado_en_pago_id: string | null;
    expira_en: string | null;
};

export const MONTO_MAXIMO_RECARGA = 200;

export function useRecarga() {
    const { session } = useAuth();

    const [monto, setMonto] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<MetodoPago | null>(null);

    const [cupones, setCupones] = useState<CuponRecarga[]>([]);
    const [cuponSeleccionado, setCuponSeleccionado] = useState<CuponRecarga | null>(null);

    const usuarioId = session?.user?.id;

    // (Usamos useMemo para que esto no se calcule 100 veces por segundo, solo cuando el monto cambia de verdad)
    const montoNumerico = useMemo(() => {
        const valor = obtenerMontoNumerico(monto);
        return Number.isNaN(valor) ? 0 : valor;
    }, [monto]);

    const descuentoCupon = useMemo(() => {
        if (!cuponSeleccionado || montoNumerico <= 0) return 0;

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0);

        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((montoNumerico * valorDescuento) / 100).toFixed(2));
        }

        // (Si el cupón es de 10 dólares pero solo va a recargar 5, le descontamos 5 nomás)
        return Math.min(valorDescuento, montoNumerico);
    }, [cuponSeleccionado, montoNumerico]);

    const totalSimuladoAPagar = useMemo(() => {
        return Number(Math.max(montoNumerico - descuentoCupon, 0).toFixed(2));
    }, [montoNumerico, descuentoCupon]);

    const cargarDatosRecarga = useCallback(async () => {
        if (!usuarioId) return;

        try {
            setLoadingData(true);

            // Buscamos sus tarjetas usando el servicio
            const { data: metodosData, error: metodosError } = await BilleteraService.obtenerMetodosPago(usuarioId);

            if (metodosError) {
                console.log(metodosError.message);
                CustomAlert.alert('Error', 'No se pudieron cargar tus métodos de pago');
                return;
            }

            setMetodosPago(metodosData || []);

            // Si tiene tarjetas pero no seleccionó ninguna le marcamos la primera por cortesía
            if (metodosData && metodosData.length > 0 && !metodoPagoSeleccionado) {
                setMetodoPagoSeleccionado(metodosData[0]);
            }

            // Buscamos sus cupones
            const { data: cuponesData, error: cuponesError } = await CuponesService.obtenerCuponesDisponibles(usuarioId, 'cliente');

            if (cuponesError) {
                console.log(cuponesError.message);
                CustomAlert.alert('Error', 'No se pudieron cargar tus cupones');
                return;
            }

            // (Filtramos por si alguno ya se pasó de la hora de expiración)
            const cuponesDisponibles = (cuponesData || []).filter((cupon) => {
                if (!cupon.expira_en) return true;
                return new Date(cupon.expira_en) >= new Date();
            });

            setCupones(cuponesDisponibles as CuponRecarga[]);
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar datos de recarga');
        } finally {
            setLoadingData(false);
        }
    }, [usuarioId, metodoPagoSeleccionado]);

    useEffect(() => {
        cargarDatosRecarga();
    }, [cargarDatosRecarga]);

    async function handleRecargar() {
        const usuarioId = session?.user?.id;
        const montoFinal = obtenerMontoNumerico(monto);

        if (!usuarioId) {
            CustomAlert.alert('Error', 'No se pudo obtener el usuario actual');
            return;
        }

        if (!monto.trim() || Number.isNaN(montoFinal) || montoFinal <= 0) {
            CustomAlert.alert('Monto inválido', 'Ingresa un monto válido mayor a $0.00');
            return;
        }

        if (montoFinal > MONTO_MAXIMO_RECARGA) {
            CustomAlert.alert('Monto excedido', `El monto máximo de recarga es $${MONTO_MAXIMO_RECARGA.toFixed(2)}`);
            return;
        }

        if (!metodoPagoSeleccionado) {
            CustomAlert.alert('Método de pago requerido', 'Debes seleccionar una tarjeta activa para recargar');
            return;
        }

        try {
            setLoading(true);

            // Buscamos su billetera
            const { data: billetera, error: billeteraError } = await BilleteraService.obtenerBilletera(usuarioId);

            if (billeteraError || !billetera) {
                CustomAlert.alert('Billetera no encontrada', 'Tu usuario todavía no tiene una billetera Q-Ruta');
                return;
            }

            if (billetera.estado !== 'activa') {
                CustomAlert.alert('Billetera inactiva', 'Tu billetera no está activa para recibir recargas');
                return;
            }

            const saldoActual = Number(billetera.saldo || 0);
            const nuevoSaldo = Number((saldoActual + montoFinal).toFixed(2));

            const datosRecarga = {
                usuario_id: usuarioId,
                billetera_id: billetera.id,
                monto: montoFinal,
                metodo: metodoPagoSeleccionado.tipo,
                estado: 'aprobada',
            };

            const descripcionRecarga = cuponSeleccionado
                ? `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}. Cupón aplicado: ${cuponSeleccionado.codigo}`
                : `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}`;

            const datosMovimiento = {
                usuario_id: usuarioId,
                tipo: 'recarga',
                descripcion: descripcionRecarga,
                monto: montoFinal,
                estado: 'completado',
                referencia_id: '',
            };

            const datosMovimientoCupon = cuponSeleccionado ? {
                usuario_id: usuarioId,
                tipo: 'cupon',
                descripcion: `Cupón canjeado: ${cuponSeleccionado.codigo}. Descuento simulado: $${descuentoCupon.toFixed(2)}`,
                monto: 0,
                estado: 'completado',
                referencia_id: cuponSeleccionado.id,
            } : null;

            // (Mandamos todo el paquete de datos al servicio para que haga la magia y todo quede registrado juntito)
            const result = await BilleteraService.procesarRecarga(
                usuarioId,
                billetera.id,
                nuevoSaldo,
                datosRecarga,
                datosMovimiento,
                cuponSeleccionado,
                datosMovimientoCupon
            );

            if (result.error) {
                CustomAlert.alert('Error', `Ocurrió un problema en el paso: ${result.paso}`);
                return;
            }

            CustomAlert.alert(
                'Recarga exitosa',
                cuponSeleccionado
                    ? `Se recargaron $${montoFinal.toFixed(2)}. Descuento simulado aplicado: $${descuentoCupon.toFixed(2)}`
                    : `Se recargaron $${montoFinal.toFixed(2)} a tu tarjeta Q-Ruta`,
                [{ text: 'Aceptar', onPress: () => router.replace('/cliente') }]
            );
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al recargar saldo');
        } finally {
            setLoading(false);
        }
    }

    return {
        monto,
        setMonto,
        loading,
        loadingData,
        metodosPago,
        metodoPagoSeleccionado,
        setMetodoPagoSeleccionado,
        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,
        descuentoCupon,
        totalSimuladoAPagar,
        cargarDatosRecarga,
        handleRecargar,
    };
}