import { supabase } from '../lib/supabase'

// (ESTE ARCHIVO ES EL PORTERO OFICIAL DE LA APP SE ENCARGA DE TODO LO RELACIONADO CON LA AUTENTICACIÓN DE USUARIOS COMO INICIAR SESIÓN REGISTRARSE CERRAR SESIÓN Y BUSCAR PERFILES)

// (Los únicos tres roles que reconoce nuestra aplicación para controlar el acceso)
export type Rol = 'cliente' | 'operador' | 'admin'

// (Objeto que agrupa todos los métodos de autenticación y consulta de perfiles)
export const AuthService = {
    // (Busca el perfil completo de un usuario en la tabla perfiles usando su ID de Supabase Auth)
    obtenerPerfil: async (userId: string) => {
        const { data, error } = await supabase
            .from('perfiles')
            // (Seleccionamos solo las columnas que necesitamos para no descargar datos innecesarios)
            .select('id, usuario, rol, estado, gasolinera_id, cedula, nombre, apellido, telefono, correo')
            // (Filtramos por la ID única del usuario)
            .eq('id', userId)
            // (single() asegura que nos devuelva un objeto y no un arreglo ya que la ID es única)
            // (Si no existe el perfil single() lanza un error en lugar de devolver null)
            .single()

        return { data, error }
    },

    // (Busca un perfil por su correo electrónico para el flujo de recuperar contraseña)
    // (Se usa para saber si el correo existe y qué rol tiene antes de permitirle recuperar)
    verificarCorreoRecuperacion: async (correo: string) => {
        const { data, error } = await supabase
            .from('perfiles')
            // (Solo necesitamos la ID el rol y el estado para tomar la decisión)
            .select('id, rol, estado')
            // (Buscamos el perfil por el correo que escribió en el formulario)
            .eq('correo', correo)
            .single()

        return { data, error }
    },

    // (Le dice a Supabase que verifique el correo y la contraseña y abra la sesión si coinciden)
    iniciarSesion: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        
        return { data, error }
    },

    // (Crea una cuenta nueva en Supabase Auth y dispara el trigger de la base de datos para crear el perfil)
    registrarse: async (email: string, password: string, userData: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // (Esta data extra se guarda en los metadatos del usuario de Supabase Auth)
                // (Un trigger en la base de datos escucha esta señal y crea el perfil en la tabla perfiles automáticamente)
                data: userData,
            },
        })

        return { data, error }
    },

    // (Destruye la sesión activa del usuario en Supabase y limpia el token local)
    cerrarSesion: async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas obtenerPerfil la app no sabrá el rol del usuario y nadie podrá ser redirigido al panel correcto)
(si quitas verificarCorreoRecuperacion el flujo de recuperar contraseña nunca podrá verificar si el correo existe ni saber si es una cuenta corporativa)
(si quitas iniciarSesion el botón de entrar simplemente no hará nada porque no habrá cómo comunicarse con Supabase)
(si quitas registrarse el formulario de crear cuenta quedará sin efecto y ningún cliente nuevo llegará jamás a la base de datos)
(si quitas cerrarSesion el botón de salir dejará al usuario atrapado en el panel aunque aparezca cerrado)
*/
