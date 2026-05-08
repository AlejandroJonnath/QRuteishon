import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type MetodoRecarga = 'credito' | 'debito';

export const MONTO_MAXIMO_RECARGA = 200;

export function useRecarga() {
    const { session } = useAuth();

    const [monto, setMonto] = useState('');
    const [metodo, setMetodo] = useState<MetodoRecarga>('credito');
    const [loading, setLoading] = useState(false);

    function obtenerMontoNumerico() {
        return Number(monto.replace(',', '.'));
    }

    async function handleRecargar() {
        const usuarioId = session?.user?.id;
        const montoNumerico = obtenerMontoNumerico();

        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual.');
            return;
        }

        if (!monto.trim()) {
            Alert.alert('Campo requerido', 'Ingresa el monto que deseas recargar.');
            return;
        }

        if (Number.isNaN(montoNumerico) || montoNumerico <= 0) {
            Alert.alert('Monto inválido', 'Ingresa un monto válido mayor a $0.00.');
            return;
        }

        if (montoNumerico > MONTO_MAXIMO_RECARGA) {
            Alert.alert(
                'Monto excedido',
                `El monto máximo de recarga es $${MONTO_MAXIMO_RECARGA.toFixed(2)}.`
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
            const nuevoSaldo = Number((saldoActual + montoNumerico).toFixed(2));

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

            const { data: recarga, error: recargaError } = await supabase
                .from('recargas')
                .insert({
                    usuario_id: usuarioId,
                    billetera_id: billetera.id,
                    monto: montoNumerico,
                    metodo,
                    estado: 'aprobada',
                })
                .select('id')
                .single();

            if (recargaError) {
                console.log(recargaError.message);
                Alert.alert(
                    'Recarga aplicada',
                    'El saldo fue actualizado, pero no se pudo guardar el registro de recarga.'
                );
                return;
            }

            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    tipo: 'recarga',
                    descripcion:
                        metodo === 'credito'
                            ? 'Recarga simulada con tarjeta de crédito'
                            : 'Recarga simulada con tarjeta de débito',
                    monto: montoNumerico,
                    estado: 'completado',
                    referencia_id: recarga.id,
                });

            if (movimientoError) {
                console.log(movimientoError.message);
            }

            Alert.alert(
                'Recarga exitosa',
                `Se recargaron $${montoNumerico.toFixed(2)} a tu tarjeta Q-Ruta.`,
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
        metodo,
        setMetodo,
        loading,
        handleRecargar,
    };
}
