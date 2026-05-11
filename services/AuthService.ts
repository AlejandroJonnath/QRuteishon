import { supabase } from '../lib/supabase';

// Tipos de roles para que TypeScript sepa con quién tratamos
export type Rol = 'cliente' | 'operador' | 'admin';

export const AuthService = {
    // Buscamos el perfil del usuario para saber su rol y si está activo o suspendido
    obtenerPerfil: async (userId: string) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('id, usuario, rol, estado, gasolinera_id')
            .eq('id', userId)
            // (single() asegura que solo nos devuelva un objeto y no un arreglo, si no lo encuentra tira error)
            .single();

        return { data, error };
    },

    // Le decimos a Supabase que nos loguee
    iniciarSesion: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        return { data, error };
    },

    // Creamos una cuenta nueva
    registrarse: async (email: string, password: string, userData: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // (esto guarda la data extra para que un trigger en la base de datos cree el perfil solito sin que tengamos que hacer otro insert)
                data: userData,
            },
        });

        return { data, error };
    },

    // Chau sesión
    cerrarSesion: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    }
};
