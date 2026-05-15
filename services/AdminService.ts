import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Rol } from './AuthService'

// (ESTE ARCHIVO ES EL SERVICIO MÁS PODEROSO DE LA APP TIENE ACCESO DE ADMINISTRADOR A SUPABASE LO QUE SIGNIFICA QUE PUEDE CREAR USUARIOS CAMBIAR CONTRASEÑAS Y CONSULTAR MÉTRICAS SIN INTERFERIR CON LA SESIÓN ACTIVA)

// (Creamos un cliente secundario de Supabase completamente separado del normal)
// (Este cliente NO guarda sesión así que el admin puede crear usuarios sin que la app lo desloguee por accidente)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
// (IMPORTANTE: Para usar las funciones admin como cambiar contraseña a la fuerza necesitamos el service_role_key)
// (Si no se provee esta clave en el .env las funciones admin devolverán error 403 de permiso denegado)
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// (Creamos el cliente administrador con la clave especial y sin persistencia de sesión)
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // (No guardamos sesión porque este cliente solo lo usamos para acciones puntuales de admin)
        persistSession: false,
        // (No refrescamos el token automáticamente porque este cliente no tiene sesión de usuario)
        autoRefreshToken: false,
        // (No detectamos sesión desde la URL porque es un cliente de solo servicio)
        detectSessionInUrl: false,
    }
})

// (Objeto principal que agrupa todas las funciones de administración del sistema)
export const AdminService = {
    // (Trae todos los perfiles de un rol específico ordenados del más nuevo al más viejo)
    obtenerUsuariosPorRol: async (rol: Rol) => {
        const { data, error } = await supabase
            .from('perfiles')
            // (Traemos todas las columnas del perfil)
            .select('*')
            // (Filtramos solo el rol que nos piden)
            .eq('rol', rol)
            // (Los más nuevos primero para ver los cambios recientes al tope)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    // (Esta función usa el cliente secundario para crear un usuario nuevo en Supabase Auth)
    // (Es vital usar el cliente secundario para no perder la sesión del administrador actual)
    crearUsuario: async (email: string, password: string, userData: any) => {
        const { data, error } = await supabaseAdminClient.auth.signUp({
            email,
            password,
            options: {
                // (La data extra activa un trigger en la base de datos que crea el perfil automáticamente)
                data: userData,
            },
        })

        return { data, error }
    },

    // (Actualiza los datos del perfil de un usuario específico en la tabla perfiles)
    actualizarUsuario: async (id: string, datos: any) => {
        const { error } = await supabase
            .from('perfiles')
            // (Machacamos los datos viejos con los nuevos)
            .update(datos)
            // (Solo afectamos al usuario con esta ID exacta)
            .eq('id', id)

        return { error }
    },

    // (Cambia el estado de activo a inactivo o viceversa para bloquear o desbloquear usuarios)
    cambiarEstadoUsuario: async (id: string, estado: 'activo' | 'inactivo') => {
        const { error } = await supabase
            .from('perfiles')
            // (Solo tocamos el campo de estado)
            .update({ estado })
            .eq('id', id)

        return { error }
    },

    // (Esta función solo funciona con el service_role_key porque requiere permisos de superusuario)
    // (Cambia la contraseña directamente en Supabase Auth sin necesitar la clave anterior)
    forzarCambioContrasena: async (id: string, password: string) => {
        const { data, error } = await supabaseAdminClient.auth.admin.updateUserById(id, {
            password: password
        })
        
        return { data, error }
    },

    // (Trae todas las gasolineras activas del sistema ordenadas por nombre de la A a la Z)
    obtenerGasolineras: async () => {
        const { data, error } = await supabase
            .from('gasolineras')
            .select('*')
            // (Solo las que están operativas no las que cerraron)
            .eq('estado', 'activa')
            // (Ordenadas alfabéticamente para que el selector sea fácil de leer)
            .order('nombre', { ascending: true })

        return { data, error }
    },

    // (Trae absolutamente todos los cupones del sistema sin importar su estado)
    obtenerTodosLosCupones: async () => {
        const { data, error } = await supabase
            .from('cupones')
            .select('*')
            // (Los más nuevos primero)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    // (Inserta un solo cupón en la base de datos)
    crearCupon: async (datosCupon: any) => {
        const { error } = await supabase
            .from('cupones')
            .insert(datosCupon)

        return { error }
    },

    // (Inserta un arreglo completo de cupones de golpe para la generación masiva)
    generarCuponesAutomaticos: async (cupones: any[]) => {
        const { error } = await supabase
            .from('cupones')
            // (Un solo insert con todos los cupones del lote es más eficiente que hacerlos uno por uno)
            .insert(cupones)

        return { error }
    },

    // (Cambia el estado de un cupón específico para habilitarlo o deshabilitarlo)
    cambiarEstadoCupon: async (id: string, estado: string) => {
        const { error } = await supabase
            .from('cupones')
            .update({ estado })
            .eq('id', id)

        return { error }
    },

    // (Función del dashboard que cuenta cuántos hay de todo para mostrar las tarjetas de estadísticas)
    obtenerTotalesDashboard: async () => {
        // (Hacemos las cuatro consultas al mismo tiempo con Promise.all para que sea rápido)
        // (Traemos solo lo necesario para contar sin descargar columnas que no usamos)
        const [usuarios, pagos, recargas, cupones] = await Promise.all([
            // (Solo el rol para poder filtrar después)
            supabase.from('perfiles').select('rol'),
            // (Solo los pagos exitosos)
            supabase.from('pagos_qr').select('id').eq('estado', 'aprobado'),
            // (Solo las recargas completadas)
            supabase.from('recargas').select('id').eq('estado', 'aprobada'),
            // (Todos los cupones sin importar estado)
            supabase.from('cupones').select('id')
        ])

        // (Devolvemos todos los datos en un solo objeto para que el hook los distribuya)
        return {
            usuarios: usuarios.data || [],
            totalPagos: pagos.data?.length || 0,
            totalRecargas: recargas.data?.length || 0,
            totalCupones: cupones.data?.length || 0,
            // (Si cualquiera de las cuatro consultas falló aquí viene el error)
            error: usuarios.error || pagos.error || recargas.error || cupones.error
        }
    },

    // (Función de analíticas que trae los últimos 50 movimientos de dinero para calcular ingresos)
    obtenerDetallesAnaliticas: async () => {
        // (Hacemos las dos consultas al mismo tiempo para ahorrar tiempo)
        const [pagosRecientes, recargasRecientes] = await Promise.all([
            supabase.from('pagos_qr')
                // (Solo los campos que necesitamos para las sumas del dashboard)
                .select('id, total, tipo_gasolina, pagado_en')
                .eq('estado', 'aprobado')
                // (Los más recientes primero)
                .order('pagado_en', { ascending: false })
                // (Limitamos a 50 para no descargar toda la historia del sistema)
                .limit(50),
            
            supabase.from('recargas')
                .select('id, monto, metodo, created_at')
                .eq('estado', 'aprobada')
                .order('created_at', { ascending: false })
                .limit(50)
        ])

        // (Devolvemos las dos listas y cualquier error que haya ocurrido)
        return {
            pagos: pagosRecientes.data || [],
            recargas: recargasRecientes.data || [],
            error: pagosRecientes.error || recargasRecientes.error
        }
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas crearUsuario el formulario de crear admin cliente u operador se guardará en el estado pero nunca llegará a la base de datos)
(si quitas forzarCambioContrasena el flujo de recuperar contraseña pasará todas las fases pero la clave nunca cambiará en Supabase)
(si quitas obtenerTotalesDashboard todas las tarjetas de estadísticas del panel de admin mostrarán cero aunque haya movimientos reales)
(si quitas obtenerGasolineras el selector de gasolinera en el formulario de operadores aparecerá vacío y no se podrá asignar a nadie)
(si quitas supabaseAdminClient el cliente de administración que usa crearUsuario y forzarCambioContrasena estas funciones darán error 403 inmediatamente)
*/
