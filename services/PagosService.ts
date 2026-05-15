import { supabase } from '../lib/supabase'
import type { PagoQr } from '../hooks/ClienteHooks/UsePagarQr'

// (ESTE ARCHIVO MANEJA ABSOLUTAMENTE TODO EL CICLO DE VIDA DE UN PAGO CON QR DESDE QUE EL OPERADOR LO CREA HASTA QUE EL CLIENTE LO PAGA Y EL OPERADOR EMITE LA FACTURA)

// (Objeto que agrupa todas las funciones del módulo de pagos QR)
export const PagosService = {
    // (Busca un cobro en la base de datos usando el token único que viene encriptado dentro del QR)
    buscarPagoPorToken: async (token: string) => {
        const { data, error } = await supabase
            .from('pagos_qr')
            // (Seleccionamos todos los campos necesarios para procesar el pago)
            .select(
                'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en, pagado_en'
            )
            // (Buscamos el registro cuyo qr_token coincida exactamente con el escaneado)
            .eq('qr_token', token)
            // (maybeSingle devuelve null en vez de error si el QR no existe en la base)
            .maybeSingle()

        return { data: data as PagoQr | null, error }
    },

    // (Marca un QR como vencido cuando ya pasó su tiempo de vida de 5 minutos)
    marcarVencido: async (id: string) => {
        const { error } = await supabase
            .from('pagos_qr')
            // (Cambiamos el estado de pendiente a vencido)
            .update({ estado: 'vencido' })
            .eq('id', id)

        return { error }
    },

    // (Esta es la transacción más crítica de toda la app descuenta el saldo aprueba el cobro y registra el historial)
    procesarPagoBilletera: async (
        pago: PagoQr,
        usuarioId: string,
        billeteraId: string,
        nuevoSaldo: number
    ) => {
        // (Paso 1: Descontamos el dinero de la billetera del cliente primero)
        const { error: saldoError } = await supabase
            .from('billeteras')
            .update({ saldo: nuevoSaldo })
            .eq('id', billeteraId)

        // (Si falla el descuento reportamos el error antes de cambiar el estado del pago)
        if (saldoError) return { error: saldoError, paso: 'billetera' }

        // (Paso 2: Marcamos el cobro como aprobado y le asignamos el cliente que pagó)
        const { error: pagoError } = await supabase
            .from('pagos_qr')
            .update({
                estado: 'aprobado',
                // (Vinculamos el cliente al pago para que el operador sepa quién pagó)
                cliente_id: usuarioId,
                // (Guardamos la hora exacta del pago en formato ISO)
                pagado_en: new Date().toISOString(),
            })
            .eq('id', pago.id)

        // (Si falla la aprobación reportamos el paso)
        if (pagoError) return { error: pagoError, paso: 'pago' }

        // (Paso 3: Registramos el movimiento de salida en el historial de la billetera del cliente)
        const { error: movimientoError } = await supabase
            .from('movimientos')
            .insert({
                usuario_id: usuarioId,
                tipo: 'pago',
                descripcion: `Pago de gasolina ${pago.tipo_gasolina}`,
                // (Lo guardamos en negativo porque es dinero que salió de la cuenta del cliente)
                monto: -(Number(pago.total || 0)),
                estado: 'completado',
                // (Lo vinculamos al pago QR para poder rastrearlo)
                referencia_id: pago.id,
            })

        // (Paso 4 opcional: Si el cobro tenía cupón aplicado lo quemamos para que no se reutilice)
        if (pago.cupon_codigo) {
            await supabase
                .from('cupones')
                .update({
                    estado: 'usado',
                    // (Lo vinculamos al pago específico donde se canjeó)
                    usado_en_pago_id: pago.id,
                })
                .eq('codigo', pago.cupon_codigo)
                // (Solo afectamos cupones que aún estaban disponibles para evitar doble quema)
                .eq('estado', 'disponible')
        }

        // (Devolvemos el error del movimiento pero con el paso marcado como movimiento)
        // (Esto permite al hook decidir si es un error crítico o uno menor)
        return { error: movimientoError, paso: 'movimiento' }
    },

    // (Crea el registro inicial de un cobro QR pendiente generado por el operador)
    generarPagoPendiente: async (datosPago: any) => {
        const { data, error } = await supabase
            .from('pagos_qr')
            .insert(datosPago)
            // (Pedimos que nos devuelva los datos del registro creado para dibujar el QR inmediatamente)
            .select(
                'id, qr_token, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en'
            )
            // (Queremos el objeto completo no un arreglo)
            .single()

        return { data, error }
    },

    // (Trae los últimos pagos ya cobrados del operador para que pueda elegir a cuál emitirle factura)
    obtenerPagosAprobados: async (operadorId: string, limite = 20) => {
        const { data, error } = await supabase
            .from('pagos_qr')
            // (Todos los campos para que el operador vea los detalles completos)
            .select(
                'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, descuento, total, tipo_gasolina, metodo_pago, cupon_codigo, expira_en, estado, pagado_en, created_at'
            )
            .eq('operador_id', operadorId)
            // (Solo los que ya fueron pagados exitosamente)
            .eq('estado', 'aprobado')
            // (Los más recientes primero para ver los cobros del día al tope)
            .order('pagado_en', { ascending: false })
            .limit(limite)

        return { data: data as PagoQr[], error }
    },

    // (Revisa si un cobro ya tiene una factura emitida para no duplicarla)
    verificarFacturaExistente: async (pagoId: string) => {
        const { data, error } = await supabase
            .from('facturas')
            // (Solo necesitamos saber si existe algo no los datos completos)
            .select('id')
            .eq('pago_id', pagoId)
            // (maybeSingle devuelve null si no hay factura en vez de tirar un error)
            .maybeSingle()

        return { data, error }
    },

    // (Guarda la factura nueva en la tabla de facturas)
    crearFactura: async (datosFactura: any) => {
        const { error } = await supabase
            .from('facturas')
            .insert(datosFactura)

        return { error }
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas buscarPagoPorToken la cámara escaneará el QR pero la app no podrá encontrar a qué cobro corresponde)
(si quitas procesarPagoBilletera la confirmación de pago aparecerá pero el dinero nunca se descontará ni el cobro cambiará a aprobado)
(si quitas generarPagoPendiente el operador no podrá crear nuevos cobros y el QR que se muestra en pantalla no existirá en la base de datos)
(si quitas marcarVencido los QR expirados seguirán apareciendo como pendientes y podrían procesarse aunque ya no sirvan)
(si quitas verificarFacturaExistente el mismo cobro podría tener múltiples facturas y generar problemas contables)
(si quitas crearFactura el formulario de facturas del operador se enviará pero nada llegará a la base de datos)
*/
