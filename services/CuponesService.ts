import { supabase } from '../lib/supabase'
import type { CuponRecarga } from '../hooks/ClienteHooks/UseRecarga'
import type { CuponOperador } from '../hooks/OperadorHooks/UseCuponesOperador'
import { z } from 'zod'

// OWASP Nivel 2: Validación estricta para cupones
const CrearCuponSchema = z.object({
    codigo: z.string().min(4),
    propietario_id: z.string(),
    propietario_rol: z.enum(['cliente', 'operador']),
    tipo_descuento: z.enum(['monto', 'porcentaje']),
    valor_descuento: z.number().positive(),
    uso_unico: z.boolean(),
    estado: z.string(),
    expira_en: z.string().nullable().optional()
}).strict();

// (ESTE ARCHIVO MANEJA TODAS LAS OPERACIONES RELACIONADAS CON LOS CUPONES DE DESCUENTO TANTO PARA CLIENTES COMO PARA OPERADORES)

// (Objeto que agrupa las funciones del módulo de cupones)
export const CuponesService = {
    // (Busca todos los cupones que tiene listos para usar un usuario específico según su rol)
    obtenerCuponesDisponibles: async (propietarioId: string, rol: 'cliente' | 'operador') => {
        const { data, error } = await supabase
            .from('cupones')
            // (Seleccionamos todos los campos relevantes del cupón)
            .select(
                'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en, created_at'
            )
            // (Filtramos por el ID del dueño del cupón)
            .eq('propietario_id', propietarioId)
            // (Y también por el rol para que clientes no vean cupones de operadores y viceversa)
            .eq('propietario_rol', rol)
            // (Solo los que están disponibles para no mostrar los ya usados o vencidos)
            .eq('estado', 'disponible')
            // (Los más nuevos primero)
            .order('created_at', { ascending: false })

        // (Devolvemos el tipo correcto según el rol usando una unión de tipos)
        return { data: data as CuponRecarga[] | CuponOperador[], error }
    },

    // (Verifica si el operador ya generó su cupón mensual de beneficio para evitar duplicados)
    verificarCuponMesActual: async (operadorId: string, inicioMes: Date, inicioSiguienteMes: Date) => {
        const { data, error } = await supabase
            .from('cupones')
            // (Solo necesitamos saber si existe y cuál es su código)
            .select('id, codigo, created_at')
            .eq('propietario_id', operadorId)
            .eq('propietario_rol', 'operador')
            // (Buscamos cupones creados entre el primer día del mes y el primer día del mes siguiente)
            // (gte significa mayor o igual que y lt significa estrictamente menor que)
            .gte('created_at', inicioMes.toISOString())
            .lt('created_at', inicioSiguienteMes.toISOString())
            // (maybeSingle devuelve null si no existe en vez de lanzar un error)
            .maybeSingle()

        return { data, error }
    },

    // (Inserta un cupón nuevo en la base de datos)
    crearCupon: async (datosCupon: any) => {
        try {
            CrearCuponSchema.parse(datosCupon);
        } catch (validationError: any) {
            return { error: { message: validationError.errors?.[0]?.message || 'Datos de cupón inválidos' } }
        }

        const { error } = await supabase
            .from('cupones')
            .insert(datosCupon)

        return { error }
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas obtenerCuponesDisponibles los selectores de cupones en recargar y en agregar pago siempre estarán vacíos aunque el usuario tenga descuentos)
(si quitas verificarCuponMesActual el operador podría generarse cientos de cupones mensuales de beneficio en un solo día)
(si quitas crearCupon el botón de crear cupón mensual del operador no insertará nada en la base y el cupón nunca existirá)
*/
