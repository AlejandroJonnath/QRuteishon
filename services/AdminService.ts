import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Rol } from './AuthService';

// (Creamos un cliente secundario de Supabase que NO guarda sesión, 
// así el admin puede crear usuarios sin que la app lo desloguee por accidente)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    }
});

export const AdminService = {
    // -----------------------------------------------------
    // USUARIOS
    // -----------------------------------------------------
    obtenerUsuariosPorRol: async (rol: Rol) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('rol', rol)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    crearUsuario: async (email: string, password: string, userData: any) => {
        // Usamos el cliente secundario para no matar la sesión del admin
        const { data, error } = await supabaseAdminClient.auth.signUp({
            email,
            password,
            options: {
                data: userData,
            },
        });

        return { data, error };
    },

    actualizarUsuario: async (id: string, datos: any) => {
        const { error } = await supabase
            .from('perfiles')
            .update(datos)
            .eq('id', id);

        return { error };
    },

    cambiarEstadoUsuario: async (id: string, estado: 'activo' | 'inactivo') => {
        const { error } = await supabase
            .from('perfiles')
            .update({ estado })
            .eq('id', id);

        return { error };
    },

    // -----------------------------------------------------
    // CUPONES
    // -----------------------------------------------------
    obtenerTodosLosCupones: async () => {
        const { data, error } = await supabase
            .from('cupones')
            .select('*')
            .order('created_at', { ascending: false });

        return { data, error };
    },

    crearCupon: async (datosCupon: any) => {
        const { error } = await supabase
            .from('cupones')
            .insert(datosCupon);

        return { error };
    },

    generarCuponesAutomaticos: async (cupones: any[]) => {
        const { error } = await supabase
            .from('cupones')
            .insert(cupones);

        return { error };
    },

    cambiarEstadoCupon: async (id: string, estado: string) => {
        const { error } = await supabase
            .from('cupones')
            .update({ estado })
            .eq('id', id);

        return { error };
    },

    // -----------------------------------------------------
    // ANALÍTICAS Y DASHBOARD
    // -----------------------------------------------------
    obtenerTotalesDashboard: async () => {
        // (Traemos todo rápido y lo contamos en memoria porque la app recién empieza y no son miles de millones de registros)
        const [usuarios, pagos, recargas, cupones] = await Promise.all([
            supabase.from('perfiles').select('rol'),
            supabase.from('pagos_qr').select('id').eq('estado', 'aprobado'),
            supabase.from('recargas').select('id').eq('estado', 'aprobada'),
            supabase.from('cupones').select('id')
        ]);

        return {
            usuarios: usuarios.data || [],
            totalPagos: pagos.data?.length || 0,
            totalRecargas: recargas.data?.length || 0,
            totalCupones: cupones.data?.length || 0,
            error: usuarios.error || pagos.error || recargas.error || cupones.error
        };
    },

    obtenerDetallesAnaliticas: async () => {
        const [pagosRecientes, recargasRecientes] = await Promise.all([
            supabase.from('pagos_qr')
                .select('id, total, tipo_gasolina, pagado_en')
                .eq('estado', 'aprobado')
                .order('pagado_en', { ascending: false })
                .limit(50),
            
            supabase.from('recargas')
                .select('id, monto, metodo, created_at')
                .eq('estado', 'aprobada')
                .order('created_at', { ascending: false })
                .limit(50)
        ]);

        return {
            pagos: pagosRecientes.data || [],
            recargas: recargasRecientes.data || [],
            error: pagosRecientes.error || recargasRecientes.error
        };
    }
};
