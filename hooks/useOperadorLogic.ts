import { router } from 'expo-router';
import { useRequireRole } from './useRequireRole';
import { useAuth } from '../context/AuthContext';

export function useOperadorLogic() {
    const { perfil, loading } = useRequireRole('operador');
    const { signOut } = useAuth();

    async function handleLogout() {
        await signOut();
        router.replace('/login');
    }

    return { perfil, loading, handleLogout };
}
