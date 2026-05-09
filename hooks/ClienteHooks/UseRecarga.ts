import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] =
        useState<MetodoPago | null>(null);

    const [cupones, setCupones] = useState<CuponRecarga[]>([]);
    const [cuponSeleccionado, setCuponSeleccionado] =
        useState<CuponRecarga | null>(null);

    const usuarioId = session?.user?.id;

    function obtenerMontoNumerico() {
        return Number(monto.replace(',', '.'));
    }

    const montoNumerico = useMemo(() => {
        const valor = obtenerMontoNumerico();
        return Number.isNaN(valor) ? 0 : valor;
    }, [monto]);

    const descuentoCupon = useMemo(() => {
        if (!cuponSeleccionado || montoNumerico <= 0) return 0;

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0);

        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((montoNumerico * valorDescuento) / 100).toFixed(2));
        }

        return Math.min(valorDescuento, montoNumerico);
    }, [cuponSeleccionado, montoNumerico]);

    const totalSimuladoAPagar = useMemo(() => {
        return Number(Math.max(montoNumerico - descuentoCupon, 0).toFixed(2));
    }, [montoNumerico, descuentoCupon]);

    const cargarDatosRecarga = useCallback(async () => {
        if (!usuarioId) return;

        try {
            setLoadingData(true);

            const { data: metodosData, error: metodosError } = await supabase
                .from('metodos_pago')
                .select('id, usuario_id, tipo, marca, ultimos_4, titular, estado')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'activa')
                .order('created_at', { ascending: false });

            if (metodosError) {
                console.log(metodosError.message);
                Alert.alert('Error', 'No se pudieron cargar tus métodos de pago.');
                return;
            }

            const metodosActivos = (metodosData || []) as MetodoPago[];
            setMetodosPago(metodosActivos);

            if (metodosActivos.length > 0 && !metodoPagoSeleccionado) {
                setMetodoPagoSeleccionado(metodosActivos[0]);
            }

            const { data: cuponesData, error: cuponesError } = await supabase
                .from('cupones')
                .select(
                    'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en'
                )
                .eq('propietario_id', usuarioId)
                .eq('propietario_rol', 'cliente')
                .eq('estado', 'disponible')
                .order('created_at', { ascending: false });

            if (cuponesError) {
                console.log(cuponesError.message);
                Alert.alert('Error', 'No se pudieron cargar tus cupones.');
                return;
            }

            const cuponesDisponibles = ((cuponesData || []) as CuponRecarga[]).filter(
                (cupon) => {
                    if (!cupon.expira_en) return true;
                    return new Date(cupon.expira_en) >= new Date();
                }
            );

            setCupones(cuponesDisponibles);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar datos de recarga.');
        } finally {
            setLoadingData(false);
        }
    }, [usuarioId, metodoPagoSeleccionado]);

    useEffect(() => {
        cargarDatosRecarga();
    }, [cargarDatosRecarga]);

    async function handleRecargar() {
        const usuarioId = session?.user?.id;
        const montoFinal = obtenerMontoNumerico();

        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual.');
            return;
        }

        if (!monto.trim()) {
            Alert.alert('Campo requerido', 'Ingresa el monto que deseas recargar.');
            return;
        }

        if (Number.isNaN(montoFinal) || montoFinal <= 0) {
            Alert.alert('Monto inválido', 'Ingresa un monto válido mayor a $0.00.');
            return;
        }

        if (montoFinal > MONTO_MAXIMO_RECARGA) {
            Alert.alert(
                'Monto excedido',
                `El monto máximo de recarga es $${MONTO_MAXIMO_RECARGA.toFixed(2)}.`
            );
            return;
        }

        if (!metodoPagoSeleccionado) {
            Alert.alert(
                'Método de pago requerido',
                'Debes tener y seleccionar una tarjeta de crédito o débito activa para recargar.'
            );
            return;
        }

        try {
            setLoading(true);

            const { data: billetera, error: billeteraError } = await supabase
                .from('billeteras')
                .select('id, saldo, estado')
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (billeteraError) {
                console.log(billeteraError.message);
                Alert.alert('Error', 'No se pudo consultar tu billetera.');
                return;
            }

            if (!billetera) {
                Alert.alert(
                    'Billetera no encontrada',
                    'Tu usuario todavía no tiene una billetera Q-Ruta.'
                );
                return;
            }

            if (billetera.estado !== 'activa') {
                Alert.alert(
                    'Billetera inactiva',
                    'Tu billetera no está activa para recibir recargas.'
                );
                return;
            }

            const saldoActual = Number(billetera.saldo || 0);
            const nuevoSaldo = Number((saldoActual + montoFinal).toFixed(2));

            const { data: recarga, error: recargaError } = await supabase
                .from('recargas')
                .insert({
                    usuario_id: usuarioId,
                    billetera_id: billetera.id,
                    monto: montoFinal,
                    metodo: metodoPagoSeleccionado.tipo,
                    estado: 'aprobada',
                })
                .select('id')
                .single();

            if (recargaError) {
                console.log(recargaError.message);
                Alert.alert('Error', 'No se pudo guardar la recarga.');
                return;
            }

            const { error: saldoError } = await supabase
                .from('billeteras')
                .update({
                    saldo: nuevoSaldo,
                })
                .eq('id', billetera.id);

            if (saldoError) {
                console.log(saldoError.message);
                Alert.alert('Error', 'No se pudo actualizar el saldo.');
                return;
            }

            const descripcionRecarga = cuponSeleccionado
                ? `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}. Cupón aplicado: ${cuponSeleccionado.codigo}.`
                : `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}.`;

            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    tipo: 'recarga',
                    descripcion: descripcionRecarga,
                    monto: montoFinal,
                    estado: 'completado',
                    referencia_id: recarga.id,
                });

            if (movimientoError) {
                console.log(movimientoError.message);
            }

            if (cuponSeleccionado) {
                const { error: cuponError } = await supabase
                    .from('cupones')
                    .update({
                        estado: 'usado',
                    })
                    .eq('id', cuponSeleccionado.id)
                    .eq('estado', 'disponible');

                if (cuponError) {
                    console.log(cuponError.message);
                }

                const { error: movimientoCuponError } = await supabase
                    .from('movimientos')
                    .insert({
                        usuario_id: usuarioId,
                        tipo: 'cupon',
                        descripcion: `Cupón canjeado: ${cuponSeleccionado.codigo}. Descuento simulado: $${descuentoCupon.toFixed(2)}.`,
                        monto: 0,
                        estado: 'completado',
                        referencia_id: cuponSeleccionado.id,
                    });

                if (movimientoCuponError) {
                    console.log(movimientoCuponError.message);
                }
            }

            Alert.alert(
                'Recarga exitosa',
                cuponSeleccionado
                    ? `Se recargaron $${montoFinal.toFixed(2)}. Descuento simulado aplicado: $${descuentoCupon.toFixed(2)}. Total simulado pagado: $${totalSimuladoAPagar.toFixed(2)}.`
                    : `Se recargaron $${montoFinal.toFixed(2)} a tu tarjeta Q-Ruta.`,
                [
                    {
                        text: 'Aceptar',
                        onPress: () => router.replace('/cliente'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al recargar saldo.');
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