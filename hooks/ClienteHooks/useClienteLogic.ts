// Importamos router de expo para poder navegar entre pantallas y Href para los tipos de las rutas
import { router, type Href } from 'expo-router';
// Importamos nuestro hook que exige un rol específico para proteger esta vista
import { useRequireRole } from '../useRequireRole';
// Importamos el hook de autenticación para sacar los datos del usuario y poder cerrar sesión
import { useAuth } from '../../context/AuthContext';
// Importamos los hooks de React que necesitamos para manejar estados y efectos
import { useCallback, useEffect, useState } from 'react';
// Importamos Alert para mostrar mensajitos emergentes en la pantalla
import { Alert } from 'react-native';
// Importamos nuestra conexión a Supabase para pedirle datos a la base
import { supabase } from '../../lib/supabase';


// Definimos cómo se ve una Billetera (para que TypeScript nos ayude a no cometer errores)
type Billetera = {
    id: string;
    usuario_id: string;
    numero_tarjeta: string;
    saldo: number;
    estado: string;
    created_at: string;
};

// Definimos la estructura de un Movimiento (recargas, pagos, etc)
type Movimiento = {
    id: string;
    usuario_id: string;
    tipo: string;
    descripcion: string | null;
    monto: number;
    estado: string;
    referencia_id: string | null;
    created_at: string;
};

// Definimos la estructura de un Cupón de descuento
type Cupon = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: string;
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    usado_en_pago_id: string | null;
    expira_en: string | null;
    created_at: string;
};



// Creamos nuestro hook principal para manejar toda la lógica del panel del cliente
export function useClienteLogic() {
    // Sacamos la sesión, el perfil y la función de desloguear del contexto de autenticación
    const { session, perfil, signOut } = useAuth();

    // Creamos estados para guardar la billetera, los movimientos y los cupones que vayamos a pedirle a la base de datos
    const [billetera, setBilletera] = useState<Billetera | null>(null);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cupones, setCupones] = useState<Cupon[]>([]);
    // Un estado para saber si todavía estamos cargando los datos y mostrar un loader si es necesario
    const [loadingData, setLoadingData] = useState(true);

    // Guardamos el ID del usuario actual para usarlo en las consultas más fácil
    const usuarioId = session?.user?.id;

    // Usamos useCallback para guardar esta función en memoria y que no se vuelva a crear en cada renderizado
    // (esta función se encarga de traer todos los datos del cliente desde Supabase)
    const cargarDatosCliente = useCallback(async () => {
        // Si no hay un usuario logueado no hacemos nada
        if (!usuarioId) return;

        try {
            // Empezamos a cargar los datos (prendemos la ruedita de carga)
            setLoadingData(true);

            // Vamos a buscar la billetera del usuario a Supabase
            const { data: billeteraData, error: billeteraError } = await supabase
                .from('billeteras')
                .select('id, usuario_id, numero_tarjeta, saldo, estado, created_at')
                .eq('usuario_id', usuarioId)
                // maybeSingle hace que si no encuentra nada no tire error, solo devuelva null
                .maybeSingle();

            // Si hubo un error al buscar la billetera mostramos un mensaje
            if (billeteraError) {
                Alert.alert('Error', 'No se pudo cargar la billetera');
                console.log(billeteraError.message);
                return;
            }

            // Guardamos la billetera en nuestro estado
            setBilletera(billeteraData as Billetera | null);

            // Ahora vamos a buscar los últimos 5 movimientos del usuario
            const { data: movimientosData, error: movimientosError } = await supabase
                .from('movimientos')
                .select('id, usuario_id, tipo, descripcion, monto, estado, referencia_id, created_at')
                .eq('usuario_id', usuarioId)
                // Los ordenamos por fecha de creación para que los más recientes salgan primero
                .order('created_at', { ascending: false })
                // Solo traemos 5 para no saturar la pantalla
                .limit(5);

            // Si hay error mostramos la alerta
            if (movimientosError) {
                Alert.alert('Error', 'No se pudieron cargar los movimientos');
                console.log(movimientosError.message);
                return;
            }

            // Guardamos los movimientos (o un arreglo vacío si no hay nada)
            setMovimientos((movimientosData || []) as Movimiento[]);

            // Por último buscamos los cupones que tiene disponibles este cliente
            const { data: cuponesData, error: cuponesError } = await supabase
                .from('cupones')
                .select('id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en, created_at')
                .eq('propietario_id', usuarioId)
                .eq('propietario_rol', 'cliente')
                // Solo traemos los que todavía se pueden usar
                .eq('estado', 'disponible')
                .order('created_at', { ascending: false });

            // Si hay error mostramos la alerta
            if (cuponesError) {
                Alert.alert('Error', 'No se pudieron cargar los cupones');
                console.log(cuponesError.message);
                return;
            }

            // Guardamos los cupones en el estado
            setCupones((cuponesData || []) as Cupon[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar el panel');
        } finally {
            // Ya sea que haya funcionado o fallado, apagamos la ruedita de carga
            setLoadingData(false);
        }
    // Le decimos que solo cambie la función si cambia el ID del usuario
    }, [usuarioId]);

    // Usamos useEffect para que cuando se cargue este hook por primera vez, vaya a traer los datos
    useEffect(() => {
        cargarDatosCliente();
    }, [cargarDatosCliente]);

    // Función para cerrar la sesión y mandarlo al login
    async function handleLogout() {
        await signOut();
        router.replace('/login');
    }

    // Funciones cortitas para navegar a las otras pantallas del cliente
    function irARecargar() {
        router.push('/cliente/recargar' as Href);
    }

    function irAPagarQr() {
        router.push('/cliente/pagar-qr' as Href);
    }

    // Retornamos todo lo que la pantalla del cliente va a necesitar para funcionar
    return {
        perfil,
        billetera,
        movimientos,
        cupones,
        loadingData,
        cargarDatosCliente,
        handleLogout,
        irARecargar,
        irAPagarQr,
    };
}
