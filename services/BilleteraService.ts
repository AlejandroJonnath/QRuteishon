import { supabase } from '../lib/supabase';
import type { MetodoPago } from '../hooks/ClienteHooks/UseRecarga';

export const BilleteraService = {
    // Traemos la info de la billetera del usuario
    obtenerBilletera: async (usuarioId: string) => {
        const { data, error } = await supabase
            .from('billeteras')
            .select('id, usuario_id, numero_tarjeta, saldo, estado, created_at')
            .eq('usuario_id', usuarioId)
            // (Usamos maybeSingle para que no rompa todo si es un usuario nuevo sin billetera aún)
            .maybeSingle();

        return { data, error };
    },

    // Traemos las tarjetas de crédito o débito activas
    obtenerMetodosPago: async (usuarioId: string) => {
        const { data, error } = await supabase
            .from('metodos_pago')
            .select('id, usuario_id, tipo, marca, ultimos_4, titular, estado')
            .eq('usuario_id', usuarioId)
            .eq('estado', 'activa')
            .order('created_at', { ascending: false });

        return { data: data as MetodoPago[], error };
    },

    // Traemos los últimos movimientos para mostrarlos en el inicio
    obtenerUltimosMovimientos: async (usuarioId: string, limite = 5) => {
        const { data, error } = await supabase
            .from('movimientos')
            .select('id, usuario_id, tipo, descripcion, monto, estado, referencia_id, created_at')
            .eq('usuario_id', usuarioId)
            // (ordenamos por la fecha para ver los más nuevitos primero)
            .order('created_at', { ascending: false })
            .limit(limite);

        return { data, error };
    },

    // Función que mete la plata a la billetera y registra todo
    procesarRecarga: async (
        usuarioId: string,
        billeteraId: string,
        nuevoSaldo: number,
        datosRecarga: any,
        datosMovimiento: any,
        cuponSeleccionado?: any,
        datosMovimientoCupon?: any
    ) => {
        // Registramos que se hizo una recarga
        const { data: recarga, error: recargaError } = await supabase
            .from('recargas')
            .insert(datosRecarga)
            .select('id')
            .single();

        if (recargaError) return { error: recargaError, paso: 'recarga' };

        // Actualizamos la billetera sumando el monto
        const { error: saldoError } = await supabase
            .from('billeteras')
            .update({ saldo: nuevoSaldo })
            .eq('id', billeteraId);

        if (saldoError) return { error: saldoError, paso: 'saldo' };

        // Guardamos el historial con el ID de la recarga como referencia
        datosMovimiento.referencia_id = recarga.id;
        const { error: movimientoError } = await supabase
            .from('movimientos')
            .insert(datosMovimiento);

        if (movimientoError) console.log('Error al guardar movimiento:', movimientoError);

        // Si metió un cupón lo damos de baja para que no se pase de vivo
        if (cuponSeleccionado) {
            await supabase
                .from('cupones')
                .update({ estado: 'usado' })
                .eq('id', cuponSeleccionado.id)
                .eq('estado', 'disponible');

            if (datosMovimientoCupon) {
                await supabase.from('movimientos').insert(datosMovimientoCupon);
            }
        }

        return { error: null, paso: 'ok' };
    },

    // Agrega una nueva tarjeta
    agregarMetodoPago: async (datosMetodo: any) => {
        const { error } = await supabase
            .from('metodos_pago')
            .insert(datosMetodo);

        return { error };
    },

    // (En realidad no la borramos, solo la marcamos como inactiva por si las moscas)
    desactivarMetodo: async (id: string) => {
        const { error } = await supabase
            .from('metodos_pago')
            .update({ estado: 'inactiva' })
            .eq('id', id);

        return { error };
    }
};
