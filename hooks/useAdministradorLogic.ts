import { router } from 'expo-router';
import { useRequireRole } from './useRequireRole';
import { useAuth } from '../context/AuthContext';

export function useAdministradorLogic() {
    const { perfil, loading } = useRequireRole('admin');
    const { signOut } = useAuth();

    async function handleLogout() {
        await signOut();
        router.replace('/login');
    }

    return { perfil, loading, handleLogout };
}
