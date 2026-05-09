import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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

    function obtenerValorNumerico() {
        return Number(valor.replace(',', '.'));
    }

    const valorNumerico = useMemo(() => {
        const numero = obtenerValorNumerico();
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

            const { data, error } = await supabase
                .from('cupones')
                .select(
                    'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, expira_en'
                )
                .eq('propietario_id', operadorId)
                .eq('propietario_rol', 'operador')
                .eq('estado', 'disponible')
                .order('created_at', { ascending: false });

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los cupones del operador.');
                return;
            }

            const cuponesDisponibles = ((data || []) as CuponOperador[]).filter((cupon) => {
                if (!cupon.expira_en) return true;
                return new Date(cupon.expira_en) >= new Date();
            });

            setCupones(cuponesDisponibles);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones.');
        } finally {
            setLoadingData(false);
        }
    }, [operadorId]);

    useEffect(() => {
        cargarCuponesOperador();
    }, [cargarCuponesOperador]);

    function generarTokenQr() {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `QRUTA-${Date.now()}-${random}`;
    }

    async function generarPagoQr() {
        if (!operadorId) {
            Alert.alert('Error', 'No se pudo obtener el operador actual.');
            return;
        }

        if (!valor.trim()) {
            Alert.alert('Campo requerido', 'Ingresa el valor a pagar.');
            return;
        }

        if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
            Alert.alert('Valor inválido', 'Ingresa un valor válido mayor a $0.00.');
            return;
        }

        if (totalCalculado <= 0) {
            Alert.alert('Total inválido', 'El total a pagar no puede ser $0.00.');
            return;
        }

        try {
            setLoading(true);

            const { data: perfilOperador, error: perfilError } = await supabase
                .from('perfiles')
                .select('gasolinera_id')
                .eq('id', operadorId)
                .single();

            if (perfilError) {
                console.log(perfilError.message);
                Alert.alert('Error', 'No se pudo consultar el perfil del operador.');
                return;
            }

            if (!perfilOperador?.gasolinera_id) {
                Alert.alert(
                    'Operador sin gasolinera',
                    'Este operador no tiene una gasolinera asignada.'
                );
                return;
            }

            const qrToken = generarTokenQr();

            const expiraEn = new Date();
            expiraEn.setMinutes(expiraEn.getMinutes() + 5);

            const { data: pago, error: pagoError } = await supabase
                .from('pagos_qr')
                .insert({
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
                })
                .select(
                    'id, qr_token, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en'
                )
                .single();

            if (pagoError) {
                console.log(pagoError.message);
                Alert.alert('Error', 'No se pudo generar el pago QR.');
                return;
            }

            setPagoGenerado(pago as PagoGenerado);

            Alert.alert(
                'QR generado',
                'El cliente ya puede escanear este código desde su app.'
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al generar el pago QR.');
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