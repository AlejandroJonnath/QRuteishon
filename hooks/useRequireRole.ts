import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

type Rol = 'cliente' | 'operador' | 'admin';

export function useRequireRole(requiredRole: Rol) {
    const { session, perfil, loading } = useAuth();

    useEffect(() => {
        // (No hacemos nada hasta que termine de cargar la info)
        if (loading) return;

        // Si no hay sesión o perfil registrado va para el login
        if (!session || !perfil) {
            router.replace('/login');
            return;
        }

        // Si la cuenta está desactivada también lo sacamos
        if (perfil.estado !== 'activo') {
            router.replace('/login');
            return;
        }

        // Si tiene un rol que no es el que pedimos lo mandamos al inicio para que se redirija solo
        if (perfil.rol !== requiredRole) {
            router.replace('/');
        }
    }, [session, perfil, loading, requiredRole]);

    return { session, perfil, loading };
}