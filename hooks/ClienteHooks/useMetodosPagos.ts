import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export type TipoTarjeta = 'credito' | 'debito';

export type MetodoPago = {
    id: string;
    tipo: TipoTarjeta;
    marca: string | null;
    ultimos_4: string;
    titular: string | null;
    estado: string;
};

export function useMetodosPagos() {
    const { session } = useAuth();

    const [tipo, setTipo] = useState<TipoTarjeta>('credito');
    const [marca, setMarca] = useState('');
    const [ultimos4, setUltimos4] = useState('');
    const [titular, setTitular] = useState('');

    const [metodos, setMetodos] = useState<MetodoPago[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const usuarioId = session?.user?.id;

    useEffect(() => {
        cargarMetodos();
    }, [usuarioId]);

    async function cargarMetodos() {
        if (!usuarioId) return;

        try {
            setLoadingData(true);

            const { data, error } = await supabase
                .from('metodos_pago')
                .select('id, tipo, marca, ultimos_4, titular, estado')
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false });

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los métodos de pago.');
                return;
            }

            setMetodos((data || []) as MetodoPago[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar las tarjetas.');
        } finally {
            setLoadingData(false);
        }
    }

    async function agregarMetodoPago() {
        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual.');
            return;
        }

        if (!marca.trim() || !ultimos4.trim() || !titular.trim()) {
            Alert.alert('Campos incompletos', 'Completa la marca, últimos 4 dígitos y titular.');
            return;
        }

        if (!/^\d{4}$/.test(ultimos4.trim())) {
            Alert.alert('Dato inválido', 'Los últimos 4 dígitos deben ser exactamente 4 números.');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('metodos_pago')
                .insert({
                    usuario_id: usuarioId,
                    tipo,
                    marca: marca.trim(),
                    ultimos_4: ultimos4.trim(),
                    titular: titular.trim(),
                    estado: 'activa',
                });

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo agregar la tarjeta.');
                return;
            }

            Alert.alert('Tarjeta agregada', 'El método de pago fue registrado correctamente.');

            setMarca('');
            setUltimos4('');
            setTitular('');
            setTipo('credito');

            await cargarMetodos();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al agregar la tarjeta.');
        } finally {
            setLoading(false);
        }
    }

    async function desactivarMetodo(id: string) {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('metodos_pago')
                .update({
                    estado: 'inactiva',
                })
                .eq('id', id);

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo desactivar la tarjeta.');
                return;
            }

            await cargarMetodos();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al desactivar la tarjeta.');
        } finally {
            setLoading(false);
        }
    }

    return {
        tipo,
        setTipo,
        marca,
        setMarca,
        ultimos4,
        setUltimos4,
        titular,
        setTitular,
        metodos,
        loading,
        loadingData,
        agregarMetodoPago,
        desactivarMetodo
    };
}
