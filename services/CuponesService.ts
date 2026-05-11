import { supabase } from '../lib/supabase';
import type { CuponRecarga } from '../hooks/ClienteHooks/UseRecarga';
import type { CuponOperador } from '../hooks/OperadorHooks/UseCuponesOperador';

export const CuponesService = {
    // Buscamos los cupones que tiene listos para usar
    obtenerCuponesDisponibles: async (propietarioId: string, rol: 'cliente' | 'operador') => {
        const { data, error } = await supabase
            .from('cupones')
            .select(
                'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en, created_at'
            )
            .eq('propietario_id', propietarioId)
            .eq('propietario_rol', rol)
            // Filtramos solo los disponibles
            .eq('estado', 'disponible')
            .order('created_at', { ascending: false });

        return { data: data as CuponRecarga[] | CuponOperador[], error };
    },

    // Verificamos si el operador ya generó uno en el mes actual
    verificarCuponMesActual: async (operadorId: string, inicioMes: Date, inicioSiguienteMes: Date) => {
        const { data, error } = await supabase
            .from('cupones')
            .select('id, codigo, created_at')
            .eq('propietario_id', operadorId)
            .eq('propietario_rol', 'operador')
            // (Buscamos cupones que se hayan creado entre el inicio de este mes y el inicio del que viene)
            .gte('created_at', inicioMes.toISOString())
            .lt('created_at', inicioSiguienteMes.toISOString())
            .maybeSingle();

        return { data, error };
    },

    // Insertamos el nuevo cupón en la base
    crearCupon: async (datosCupon: any) => {
        const { error } = await supabase
            .from('cupones')
            .insert(datosCupon);

        return { error };
    }
};
