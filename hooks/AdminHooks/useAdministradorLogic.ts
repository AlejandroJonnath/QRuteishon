// Importamos el router para navegar entre las pantallas
import { router } from 'expo-router';
// Importamos nuestro hook cadenero para asegurar que solo entren administradores
import { useRequireRole } from '../useRequireRole';
// Importamos el hook de auth para poder usar la función de cerrar sesión
import { useAuth } from '../../context/AuthContext';

// Creamos la lógica que va a usar el panel del administrador
export function useAdministradorLogic() {
    // Le decimos a nuestro hook que exija el rol de admin (nos devuelve el perfil y si está cargando)
    const { perfil, loading } = useRequireRole('admin');
    
    // Sacamos la función para cerrar sesión desde nuestro contexto
    const { signOut } = useAuth();

    // Esta función se encarga de desloguear al usuario cuando toque el botón de salir
    async function handleLogout() {
        // Ejecutamos el cierre de sesión de Supabase
        await signOut();
        // Y lo mandamos de regreso a la pantalla de login
        router.replace('/login');
    }

    // Exportamos todo para que la pantalla del administrador pueda usarlo
    return { perfil, loading, handleLogout };
}
