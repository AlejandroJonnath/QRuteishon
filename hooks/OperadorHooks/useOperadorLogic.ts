import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export function useOperadorLogic() {
    const { perfil, signOut } = useAuth();

    async function handleLogout() {
        await signOut();
        // Lo sacamos a la pantalla de login sin pasaje de vuelta
        router.replace('/login');
    }

    // Funciones cortitas para no ensuciar la vista con tanto router
    function irAgregarPago() {
        router.push('/operador/agregar-pago');
    }

    function irHistorialCupones() {
        router.push('/operador/cupones');
    }

    function irGenerarFactura() {
        router.push('/operador/factura');
    }

    return {
        perfil,
        handleLogout,
        irAgregarPago,
        irHistorialCupones,
        irGenerarFactura,
    };
}