// Importamos el router para poder cambiar de pantallas
import { router } from 'expo-router';
// Nos traemos el hook de autenticación para saber los datos del operador y poder desloguearlo
import { useAuth } from '../../context/AuthContext';

// Creamos nuestro hook que maneja la lógica básica del panel del operador
export function useOperadorLogic() {
    // Sacamos el perfil y la función para cerrar sesión
    const { perfil, signOut } = useAuth();

    // Función que se encarga de desloguear al operador
    async function handleLogout() {
        // Le decimos a Supabase que cierre la sesión
        await signOut();
        // Lo mandamos al login sin dejar que vuelva atrás
        router.replace('/login');
    }

    // Funciones cortitas para navegar a las otras pantallas del operador
    // (es más limpio tenerlas acá que estar escribiendo router.push en todos lados)
    function irAgregarPago() {
        router.push('/operador/agregar-pago');
    }

    function irHistorialCupones() {
        router.push('/operador/cupones');
    }

    function irGenerarFactura() {
        router.push('/operador/factura');
    }

    // Exportamos todo para que la pantalla del operador lo pueda usar
    return {
        perfil,
        handleLogout,
        irAgregarPago,
        irHistorialCupones,
        irGenerarFactura,
    };
}