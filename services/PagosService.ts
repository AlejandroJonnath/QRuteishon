import { supabase } from '../lib/supabase';
import type { PagoQr } from '../hooks/ClienteHooks/UsePagarQr';

export const PagosService = {
    // Buscamos el pago usando el token raro del QR
    buscarPagoPorToken: async (token: string) => {
        const { data, error } = await supabase
            .from('pagos_qr')
            .select(
                'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en, pagado_en'
            )
            .eq('qr_token', token)
            // (maybeSingle() devuelve null en vez de error si el QR no existe)
            .maybeSingle();

        return { data: data as PagoQr | null, error };
    },

    // Marcamos un QR como vencido si ya pasó su hora
    marcarVencido: async (id: string) => {
        const { error } = await supabase
            .from('pagos_qr')
            .update({ estado: 'vencido' })
            .eq('id', id);

        return { error };
    },

    // Esta es la transacción pesada donde pasa de todo
    procesarPagoBilletera: async (
        pago: PagoQr,
        usuarioId: string,
        billeteraId: string,
        nuevoSaldo: number
    ) => {
        // Primero descontamos la plata (actualizamos la billetera)
        const { error: saldoError } = await supabase
            .from('billeteras')
            .update({ saldo: nuevoSaldo })
            .eq('id', billeteraId);

        if (saldoError) return { error: saldoError, paso: 'billetera' };

        // Luego marcamos el cobro como exitoso
        const { error: pagoError } = await supabase
            .from('pagos_qr')
            .update({
                estado: 'aprobado',
                cliente_id: usuarioId,
                // Guardamos a qué hora exactita pagó
                pagado_en: new Date().toISOString(),
            })
            .eq('id', pago.id);

        if (pagoError) return { error: pagoError, paso: 'pago' };

        // Guardamos el movimiento en el historial
        const { error: movimientoError } = await supabase
            .from('movimientos')
            .insert({
                usuario_id: usuarioId,
                tipo: 'pago',
                descripcion: `Pago de gasolina ${pago.tipo_gasolina}`,
                // (lo guardamos negativo porque es plata que salió de su cuenta)
                monto: -(Number(pago.total || 0)),
                estado: 'completado',
                referencia_id: pago.id,
            });

        // Quemamos el cupón si es que usó uno
        if (pago.cupon_codigo) {
            await supabase
                .from('cupones')
                .update({
                    estado: 'usado',
                    usado_en_pago_id: pago.id,
                })
                .eq('codigo', pago.cupon_codigo)
                .eq('estado', 'disponible');
        }

        // Devolvemos el error del movimiento por si falla pero el pago ya pasó
        return { error: movimientoError, paso: 'movimiento' };
    },

    // Crea un QR nuevito desde la pantalla del operador
    generarPagoPendiente: async (datosPago: any) => {
        const { data, error } = await supabase
            .from('pagos_qr')
            .insert(datosPago)
            .select(
                'id, qr_token, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en'
            )
            .single();

        return { data, error };
    },

    // Trae los últimos cobros que ya le pagaron a este operador para hacerles factura
    obtenerPagosAprobados: async (operadorId: string, limite = 20) => {
        const { data, error } = await supabase
            .from('pagos_qr')
            .select(
                'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, descuento, total, tipo_gasolina, metodo_pago, cupon_codigo, expira_en, estado, pagado_en, created_at'
            )
            .eq('operador_id', operadorId)
            .eq('estado', 'aprobado')
            .order('pagado_en', { ascending: false })
            .limit(limite);

        return { data: data as PagoQr[], error };
    },

    // Revisa si un cobro ya tiene factura para no hacerla doble
    verificarFacturaExistente: async (pagoId: string) => {
        const { data, error } = await supabase
            .from('facturas')
            .select('id')
            .eq('pago_id', pagoId)
            .maybeSingle();

        return { data, error };
    },

    // Mete la factura nuevecita a la base
    crearFactura: async (datosFactura: any) => {
        const { error } = await supabase
            .from('facturas')
            .insert(datosFactura);

        return { error };
    }
};
