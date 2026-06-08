import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { z } from 'zod'; // Importamos Zod para validación estricta de datos (OWASP M7/M4)

// (Necesario para que el navegador se cierre correctamente después del login en web o mobile)
WebBrowser.maybeCompleteAuthSession();

// (ESTE ARCHIVO ES EL PORTERO OFICIAL DE LA APP SE ENCARGA DE TODO LO RELACIONADO CON LA AUTENTICACIÓN DE USUARIOS COMO INICIAR SESIÓN REGISTRARSE CERRAR SESIÓN Y BUSCAR PERFILES)

// (Los únicos tres roles que reconoce nuestra aplicación para controlar el acceso)
export type Rol = 'cliente' | 'operador' | 'admin'

// (Esquema estricto para validar los datos de registro y evitar inyecciones o escalamiento de privilegios como inyectar rol='admin')
const RegisterSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    userData: z.object({
        nombre: z.string().min(2, "El nombre es obligatorio"),
        apellido: z.string().min(2, "El apellido es obligatorio"),
        cedula: z.string().optional(),
        telefono: z.string().optional(),
        usuario: z.string().optional(),
        correo: z.string().optional(),
        // NOTA DE SEGURIDAD: strict() asegura que si el atacante envía campos extra (como 'rol' o 'estado'), la petición sea rechazada
    }).strict()
});

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

    resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'exp://192.168.1.5:8081/reset-password',
        })
        return { error }
    },

    /*
    Bueno en resumen de lo que hice xd, le quité el await a esa función. Ahora, en lugar de quedarse congelado esperando a que Supabase termine de desatar el nudo,
    simplemente le avienta los tokens a Supabase en segundo plano, le da medio segundo de ventaja, y le dice a la pantalla de Login: "Ya está, todo en orden, apaga la ruedita y déjalo entrar xd" 
    Con esto la velocidad de inicio de sesión será casi instantánea y la app no se volverá a quedar trabada.
    */
    // (Le dice a Supabase que inicie sesión mediante un proveedor externo como Google o Microsoft)
    iniciarSesionOAuth: async (provider: 'google' | 'azure') => {
        try {
            // (1) Creamos la URL de redirección a la que el navegador volverá tras el login
            const redirectTo = makeRedirectUri();

            // (2) Le pedimos a Supabase la URL especial de autenticación para ese proveedor
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    skipBrowserRedirect: true, // Importante para manejar el navegador nosotros mismos en React Native
                    queryParams: {
                        prompt: 'select_account', // Obliga a Microsoft/Google a preguntar la cuenta siempre (limpia caché)
                    }
                },
            });

            if (error) return { error };
            if (!data?.url) return { error: new Error('No se pudo obtener la URL de inicio de sesión') };

            // (3) Abrimos el navegador seguro nativo (Chrome Tabs en Android, Safari View Controller en iOS)
            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

            // (4) Si el usuario se loguea correctamente y vuelve a la app
            if (res.type === 'success') {
                const { url } = res;

                // Extraemos los tokens de la URL (Supabase los manda como hash fragment #access_token=...)
                const hashParams = url.split('#')[1] || url.split('?')[1] || '';
                const params: { [key: string]: string } = {};
                hashParams.split('&').forEach(pair => {
                    const [key, val] = pair.split('=');
                    if (key) params[key] = decodeURIComponent(val || '');
                });

                const { access_token, refresh_token } = params;

                if (!access_token || !refresh_token) {
                    return { error: new Error('No se recibieron los tokens de acceso desde el proveedor.') };
                }

                // (5) Inyectamos la sesión manualmente en Supabase local.
                // IMPORTANTE: NO usamos 'await' aquí porque en React Native hay un bug conocido 
                // donde setSession se queda colgado infinitamente por conflictos con AsyncStorage y onAuthStateChange.
                supabase.auth.setSession({
                    access_token,
                    refresh_token
                });

                // Le damos un respiro de medio segundo para que AuthContext (el onAuthStateChange) 
                // detecte la sesión y empiece a cargar el perfil antes de redirigir a la pantalla principal.
                await new Promise(resolve => setTimeout(resolve, 500));

                return { data: { user: { id: 'oauth-user' } }, error: null };
            } else {
                return { error: new Error('Inicio de sesión cancelado por el usuario') };
            }
        } catch (error: any) {
            return { error };
        }
    },

    // (Crea una cuenta nueva en Supabase Auth y dispara el trigger de la base de datos para crear el perfil)
    registrarse: async (email: string, password: string, userData: any) => {
        // (OWASP M7/M4: Validamos los datos antes de enviarlos a la API para evitar inyección y Mass Assignment)
        try {
            RegisterSchema.parse({ email, password, userData });
        } catch (validationError: any) {
            // Retornamos el error de validación para que la UI lo maneje de forma segura sin romper la app
            return { data: null, error: { message: validationError.errors?.[0]?.message || 'Datos de registro inválidos' } };
        }

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
    },

    // (Actualiza el perfil con los campos faltantes en el Onboarding OAuth)
    actualizarPerfil: async (userId: string, data: { usuario: string, cedula: string, telefono: string }) => {
        const { error } = await supabase
            .from('perfiles')
            .update(data)
            .eq('id', userId)

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
