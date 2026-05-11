import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export function useIndexLogic() {
    const { session, perfil, loading } = useAuth();

    useEffect(() => {
        // (Esperamos a que cargue la info de sesión antes de tomar decisiones apresuradas)
        if (loading) return;

        // Si no hay sesión o no hay perfil lo pateamos al login
        if (!session || !perfil) {
            router.replace('/login');
            return;
        }

        // Si lo banearon también va pafuera
        if (perfil.estado !== 'activo') {
            router.replace('/login');
            return;
        }

        // Según el rol que tenga le abrimos la puerta de su panel
        if (perfil.rol === 'admin') {
            router.replace('/administrador');
        } else if (perfil.rol === 'operador') {
            router.replace('/operador');
        } else {
            router.replace('/cliente');
        }
    }, [session, perfil, loading]);

    return {};
}