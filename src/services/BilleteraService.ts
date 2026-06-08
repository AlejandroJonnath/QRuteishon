import { supabase } from '@/lib/supabase'
import { CuponesService } from '@/services/CuponesService'
import type { MetodoPago } from '@/features/cliente/hooks/useRecarga'
import { z } from 'zod'

// Esquemas de validación estrictos para OWASP Nivel 2
const RecargaSchema = z.object({
    usuario_id: z.string(),
    billetera_id: z.string(),
    monto: z.number().positive(),
    metodo: z.enum(['credito', 'debito']),
    estado: z.string()
}).strict();

const MovimientoSchema = z.object({
    usuario_id: z.string(),
    tipo: z.string(),
    descripcion: z.string(),
    monto: z.number(),
    estado: z.string(),
    referencia_id: z.string().optional()
}).strict();

const MetodoPagoSchema = z.object({
    usuario_id: z.string(),
    tipo: z.enum(['credito', 'debito']),
    marca: z.string().nullable().optional(),
    ultimos_4: z.string().length(4),
    titular: z.string().nullable().optional(),
    estado: z.string()
}).strict();

// (ESTE ARCHIVO MANEJA TODOS LOS MOVIMIENTOS DE DINERO DE LA BILLETERA VIRTUAL DESDE CONSULTAR EL SALDO HASTA PROCESAR UNA RECARGA COMPLETA CON CUPÓN Y REGISTRO EN EL HISTORIAL)

// (Objeto que agrupa todas las funciones de billetera digital)
export const BilleteraService = {
    // (Busca la billetera del usuario con su saldo actual y estado)
    obtenerBilletera: async (usuarioId: string) => {
        const { data, error } = await supabase
            .from('billeteras')
            // (Solo los campos necesarios para mostrar en pantalla)
            .select('id, usuario_id, numero_tarjeta, saldo, estado, created_at')
            // (Buscamos la billetera de este usuario específico)
            .eq('usuario_id', usuarioId)
            // (maybeSingle nos devuelve null en lugar de error si el usuario aún no tiene billetera)
            .maybeSingle()

        return { data, error }
    },

    // (Trae la lista de tarjetas bancarias activas del usuario para el selector de recarga)
    obtenerMetodosPago: async (usuarioId: string) => {
        const { data, error } = await supabase
            .from('metodos_pago')
            // (Solo las columnas que necesitamos para identificar la tarjeta)
            .select('id, usuario_id, tipo, marca, ultimos_4, titular, estado')
            .eq('usuario_id', usuarioId)
            // (Solo las que están activas para no mostrar tarjetas eliminadas)
            .eq('estado', 'activa')
            // (Las más recientes primero para que la última agregada aparezca al tope)
            .order('created_at', { ascending: false })

        return { data: data as MetodoPago[], error }
    },

    // (Trae los últimos N movimientos del historial del usuario para la pantalla de inicio)
    obtenerUltimosMovimientos: async (usuarioId: string, limite = 5) => {
        const { data, error } = await supabase
            .from('movimientos')
            // (Todos los campos para poder mostrar descripción tipo y monto)
            .select('id, usuario_id, tipo, descripcion, monto, estado, referencia_id, created_at')
            .eq('usuario_id', usuarioId)
            // (Los más nuevos primero para que el historial tenga sentido cronológico)
            .order('created_at', { ascending: false })
            // (Limitamos la cantidad para que no tarde demasiado)
            .limit(limite)

        return { data, error }
    },

    // (Esta es la función más importante de toda la billetera procesa la recarga de dinero de forma completa)
    // (Registra la recarga actualiza el saldo crea el movimiento en el historial y quema el cupón si había uno)
    procesarRecarga: async (
        usuarioId: string,
        billeteraId: string,
        nuevoSaldo: number,
        datosRecarga: any,
        datosMovimiento: any,
        cuponSeleccionado?: any,
        datosMovimientoCupon?: any
    ) => {
        // Validación Zod
        try {
            RecargaSchema.parse(datosRecarga);
            MovimientoSchema.parse(datosMovimiento);
            if (datosMovimientoCupon) MovimientoSchema.parse(datosMovimientoCupon);
        } catch (validationError: any) {
            return { error: { message: validationError.errors?.[0]?.message || 'Datos inválidos' }, paso: 'validacion' }
        }

        // (Paso 1: Guardamos el registro de la recarga en la tabla de recargas)
        const { data: recarga, error: recargaError } = await supabase
            .from('recargas')
            .insert(datosRecarga)
            // (Pedimos que nos devuelva la ID para usarla como referencia en el movimiento)
            .select('id')
            .single()

        // (Si falla el registro de la recarga reportamos que fue en ese paso)
        if (recargaError) return { error: recargaError, paso: 'recarga' }

        // (Paso 2: Sumamos el monto al saldo actual de la billetera del usuario)
        const { error: saldoError } = await supabase
            .from('billeteras')
            .update({ saldo: nuevoSaldo })
            .eq('id', billeteraId)

        // (Si falla la actualización del saldo reportamos el paso)
        if (saldoError) return { error: saldoError, paso: 'saldo' }

        // (Paso 3: Vinculamos el movimiento del historial a la recarga que acabamos de crear)
        datosMovimiento.referencia_id = recarga.id
        const { error: movimientoError } = await supabase
            .from('movimientos')
            .insert(datosMovimiento)

        // (Si falla el historial lo logueamos pero no detenemos todo porque la plata ya se acreditó)
        if (movimientoError) console.log('Error al guardar movimiento:', movimientoError)

        // (Paso 4 opcional: Si el usuario usó un cupón lo marcamos como usado usando el servicio centralizado)
        if (cuponSeleccionado) {
            await CuponesService.marcarCuponUsado(cuponSeleccionado.id, recarga.id)

            // (Si hay un registro de movimiento del cupón también lo insertamos en el historial)
            if (datosMovimientoCupon) {
                await supabase.from('movimientos').insert(datosMovimientoCupon)
            }
        }

        // (Si llegamos aquí es porque todo salió bien)
        return { error: null, paso: 'ok' }
    },

    // (Guarda una nueva tarjeta bancaria vinculada al usuario)
    agregarMetodoPago: async (datosMetodo: any) => {
        try {
            MetodoPagoSchema.parse(datosMetodo);
        } catch (validationError: any) {
            return { error: { message: validationError.errors?.[0]?.message || 'Datos de tarjeta inválidos' } }
        }

        const { error } = await supabase
            .from('metodos_pago')
            .insert(datosMetodo)

        return { error }
    },

    // (No borramos la tarjeta físicamente solo la marcamos inactiva por si el usuario se arrepiente)
    desactivarMetodo: async (id: string) => {
        const { error } = await supabase
            .from('metodos_pago')
            // (Cambiamos el estado a inactiva para ocultarla sin perder el registro)
            .update({ estado: 'inactiva' })
            .eq('id', id)

        return { error }
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas obtenerBilletera la pantalla del cliente siempre mostrará saldo cero y ningún pago QR podrá verificar si tiene fondos)
(si quitas procesarRecarga el botón de recargar mostrará éxito pero el saldo nunca cambiará en la base de datos)
(si quitas obtenerMetodosPago el selector de tarjetas aparecerá vacío y el usuario no podrá elegir con qué pagar)
(si quitas desactivarMetodo el botón de eliminar tarjeta dará error y las tarjetas comprometidas nunca podrán quitarse)
*/
