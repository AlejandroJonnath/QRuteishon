// Importamos los hooks básicos de React para manejar datos y efectos
import { useState, useEffect } from 'react';
// Importamos Alert para tirar mensajitos en la pantalla del celular
import { Alert } from 'react-native';
// Conectamos con Supabase para poder guardar las tarjetas en la base de datos
import { supabase } from '../../lib/supabase';
// Nos traemos el hook de autenticación para saber quién está logueado
import { useAuth } from '../../context/AuthContext';

// Definimos los tipos de tarjeta que aceptamos para que TypeScript no chille
export type TipoTarjeta = 'credito' | 'debito';

// Definimos cómo se ve un método de pago en nuestra base de datos
export type MetodoPago = {
    id: string;
    tipo: TipoTarjeta;
    marca: string | null;
    ultimos_4: string;
    titular: string | null;
    estado: string;
};

// Creamos nuestro hook que va a manejar toda la lógica de agregar y ver las tarjetas
export function useMetodosPagos() {
    // Sacamos la sesión para saber el ID del usuario actual
    const { session } = useAuth();

    // Estados para el formulario de agregar una tarjeta nueva
    const [tipo, setTipo] = useState<TipoTarjeta>('credito');
    const [marca, setMarca] = useState('');
    const [ultimos4, setUltimos4] = useState('');
    const [titular, setTitular] = useState('');

    // Estado para guardar la lista de tarjetas que ya tiene el usuario
    const [metodos, setMetodos] = useState<MetodoPago[]>([]);
    
    // Rueditas de carga para los botones y para cuando recién entra a la pantalla
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Guardamos el ID del usuario en una variable más corta
    const usuarioId = session?.user?.id;

    // Apenas cargue el hook mandamos a buscar las tarjetas del usuario
    useEffect(() => {
        cargarMetodos();
    // Le pasamos el ID como dependencia para que vuelva a buscar si cambia de usuario
    }, [usuarioId]);

    // Función que va a Supabase a traer todas las tarjetas de este cliente
    async function cargarMetodos() {
        // Si no hay nadie logueado no hacemos nada
        if (!usuarioId) return;

        try {
            // Prendemos la ruedita grande de carga
            setLoadingData(true);

            // Buscamos los métodos de pago ordenados de más nuevo a más viejo
            const { data, error } = await supabase
                .from('metodos_pago')
                .select('id, tipo, marca, ultimos_4, titular, estado')
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false });

            // Si falla la consulta a la base tiramos un mensajito de error
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los métodos de pago');
                return;
            }

            // Si todo salió bien guardamos las tarjetas en nuestro estado
            setMetodos((data || []) as MetodoPago[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar las tarjetas');
        } finally {
            // Siempre apagamos la ruedita de carga pase lo que pase
            setLoadingData(false);
        }
    }

    // Función para guardar una tarjeta nueva en la base de datos
    async function agregarMetodoPago() {
        // Verificamos por las dudas que tengamos el ID del usuario
        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual');
            return;
        }

        // Chequeamos que no manden campos vacíos
        if (!marca.trim() || !ultimos4.trim() || !titular.trim()) {
            Alert.alert('Campos incompletos', 'Completa la marca, últimos 4 dígitos y titular');
            return;
        }

        // Usamos una expresión regular para asegurar que los últimos 4 dígitos sean números de verdad
        if (!/^\d{4}$/.test(ultimos4.trim())) {
            Alert.alert('Dato inválido', 'Los últimos 4 dígitos deben ser exactamente 4 números');
            return;
        }

        try {
            // Prendemos la ruedita del botón guardar
            setLoading(true);

            // Insertamos la nueva tarjeta en la tabla
            const { error } = await supabase
                .from('metodos_pago')
                .insert({
                    usuario_id: usuarioId,
                    tipo,
                    marca: marca.trim(),
                    ultimos_4: ultimos4.trim(),
                    titular: titular.trim(),
                    // Siempre la creamos como activa
                    estado: 'activa',
                });

            // Si falla le avisamos al usuario
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo agregar la tarjeta');
                return;
            }

            // Si todo salió bien le mostramos un mensaje de éxito
            Alert.alert('Tarjeta agregada', 'El método de pago fue registrado correctamente');

            // Limpiamos el formulario para que quede como nuevo
            setMarca('');
            setUltimos4('');
            setTitular('');
            setTipo('credito');

            // Mandamos a recargar la lista de tarjetas para que aparezca la nueva
            await cargarMetodos();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al agregar la tarjeta');
        } finally {
            // Apagamos la ruedita del botón
            setLoading(false);
        }
    }

    // Función para "borrar" una tarjeta (en realidad la desactivamos nomás)
    async function desactivarMetodo(id: string) {
        try {
            // Prendemos la ruedita de carga
            setLoading(true);

            // Le decimos a Supabase que cambie el estado a inactiva
            const { error } = await supabase
                .from('metodos_pago')
                .update({
                    estado: 'inactiva',
                })
                .eq('id', id);

            // Si la base se queja avisamos
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo desactivar la tarjeta');
                return;
            }

            // Recargamos las tarjetas para que ya no aparezca el botón de desactivar en esa
            await cargarMetodos();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al desactivar la tarjeta');
        } finally {
            // Apagamos la ruedita
            setLoading(false);
        }
    }

    // Devolvemos todo el choclón de cosas para que la pantalla pueda usarlas
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
