import { useState, useEffect } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { useAuth } from '../../context/AuthContext';
import { BilleteraService } from '../../services/BilleteraService';

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

            // Delegamos la búsqueda al servicio de billetera
            const { data, error } = await BilleteraService.obtenerMetodosPago(usuarioId);

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudieron cargar los métodos de pago');
                return;
            }

            setMetodos(data || []);
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar las tarjetas');
        } finally {
            setLoadingData(false);
        }
    }

    async function agregarMetodoPago() {
        if (!usuarioId) {
            CustomAlert.alert('Error', 'No se pudo obtener el usuario actual');
            return;
        }

        if (!marca.trim() || !ultimos4.trim() || !titular.trim()) {
            CustomAlert.alert('Campos incompletos', 'Completa la marca, últimos 4 dígitos y titular');
            return;
        }

        // (Expresión regular para asegurarnos de que sí o sí sean 4 numeritos)
        if (!/^\d{4}$/.test(ultimos4.trim())) {
            CustomAlert.alert('Dato inválido', 'Los últimos 4 dígitos deben ser exactamente 4 números');
            return;
        }

        try {
            setLoading(true);

            // Pasamos los datos listos al servicio
            const datosMetodo = {
                usuario_id: usuarioId,
                tipo,
                marca: marca.trim(),
                ultimos_4: ultimos4.trim(),
                titular: titular.trim(),
                estado: 'activa',
            };

            const { error } = await BilleteraService.agregarMetodoPago(datosMetodo);

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudo agregar la tarjeta');
                return;
            }

            CustomAlert.alert('Tarjeta agregada', 'El método de pago fue registrado correctamente');

            setMarca('');
            setUltimos4('');
            setTitular('');
            setTipo('credito');

            // Volvemos a cargar todo para que la pantalla se actualice
            await cargarMetodos();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al agregar la tarjeta');
        } finally {
            setLoading(false);
        }
    }

    async function desactivarMetodo(id: string) {
        try {
            setLoading(true);

            // (El servicio se encarga de cambiar el estado a inactiva)
            const { error } = await BilleteraService.desactivarMetodo(id);

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudo desactivar la tarjeta');
                return;
            }

            await cargarMetodos();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al desactivar la tarjeta');
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
