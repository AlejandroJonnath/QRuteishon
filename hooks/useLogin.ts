import { useState } from 'react'; // Para manejar estados dentro del hook
import { Alert } from 'react-native'; // Para mostrar mensajes emergentes al usuario
import { router } from 'expo-router'; // Para navegar entre pantallas
import { supabase } from '../lib/supabase'; // Configuración de Supabase

type Rol = 'cliente' | 'operador' | 'admin'; // Definimos los roles permitidos

export function useLogin() {
    // Estados para el formulario de registro
    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');

    // Estados para correo y contraseña
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Estado para saber si se está cargando el login o registro
    const [loading, setLoading] = useState(false);

    // Estado para saber si el formulario está en modo registro o inicio de sesión
    const [modoRegistro, setModoRegistro] = useState(false);

    // Estado para saber en qué fase del registro estamos (1 o 2)
    const [registroFase, setRegistroFase] = useState(1);

    // Función para redirigir al usuario según el rol guardado en la tabla perfiles
    async function redirectByRole(userId: string) {
        const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('id, usuario, rol, estado')
            .eq('id', userId)
            .single();

        if (error || !perfil) {
            Alert.alert(
                'Perfil no encontrado',
                'El usuario existe en Auth, pero todavía no se encontró su perfil. Intenta iniciar sesión nuevamente.'
            );
            return;
        }

        if (perfil.estado !== 'activo') {
            Alert.alert(
                'Cuenta inactiva',
                'Tu cuenta está desactivada. Contacta al administrador.'
            );

            await supabase.auth.signOut();
            return;
        }

        const rol = perfil.rol as Rol;

        if (rol === 'admin') {
            router.replace('/administrador');
        } else if (rol === 'operador') {
            router.replace('/operador');
        } else {
            router.replace('/cliente');
        }
    }

    // Función para iniciar sesión
    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            if (error) {
                Alert.alert('Error al iniciar sesión', error.message);
                return;
            }

            if (!data.user) {
                Alert.alert('Error', 'No se pudo obtener el usuario.');
                return;
            }

            await redirectByRole(data.user.id);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    }

    // Avanzar a la fase 2 del registro
    function siguienteFase() {
        if (!usuario.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Ingresa usuario, correo y contraseña para continuar.');
            return;
        }

        if (password.trim().length < 6) {
            Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setRegistroFase(2);
    }

    // Volver a la fase 1 del registro
    function faseAnterior() {
        setRegistroFase(1);
    }

    // Función para registrar un nuevo usuario
    async function handleRegister() {
        if (
            !usuario.trim() ||
            !cedula.trim() ||
            !nombre.trim() ||
            !apellido.trim() ||
            !telefono.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert(
                'Campos incompletos',
                'Ingresa todos tus datos personales, correo y contraseña.'
            );
            return;
        }

        if (password.trim().length < 6) {
            Alert.alert(
                'Contraseña débil',
                'La contraseña debe tener al menos 6 caracteres.'
            );
            return;
        }

        try {
            setLoading(true);

            /*
                Aquí se crea el usuario en Supabase Auth.

                Importante:
                Ya NO insertamos manualmente en la tabla perfiles.
                Los datos personales se mandan en options.data.
                El trigger que hicimos en Supabase toma estos datos y crea automáticamente
                el perfil en la tabla perfiles usando el mismo id del usuario.
            */
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        usuario: usuario.trim(),
                        cedula: cedula.trim(),
                        nombre: nombre.trim(),
                        apellido: apellido.trim(),
                        telefono: telefono.trim(),
                        correo: email.trim(),
                    },
                },
            });

            if (error) {
                Alert.alert('Error al registrarse', error.message);
                return;
            }

            if (!data.user) {
                Alert.alert('Error', 'No se pudo crear el usuario.');
                return;
            }

            /*
                Si tienes desactivada la confirmación de correo en Supabase,
                normalmente Supabase inicia sesión automáticamente y se puede redirigir.

                Si tienes activada la confirmación por correo, data.session puede venir null,
                por lo que el usuario deberá confirmar su correo e iniciar sesión después.
            */
            if (!data.session) {
                Alert.alert(
                    'Cuenta creada',
                    'Tu cuenta fue creada correctamente. Revisa tu correo si Supabase solicita confirmación y luego inicia sesión.'
                );

                setModoRegistro(false);
                limpiarFormulario();
                return;
            }

            Alert.alert(
                'Cuenta creada',
                'Tu cuenta fue creada correctamente.'
            );

            await redirectByRole(data.user.id);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al registrarse.');
        } finally {
            setLoading(false);
        }
    }

    // Limpia todos los campos del formulario
    function limpiarFormulario() {
        setUsuario('');
        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setEmail('');
        setPassword('');
        setRegistroFase(1);
    }

    // Cambia entre modo login y modo registro
    function cambiarModo() {
        limpiarFormulario();
        setModoRegistro(!modoRegistro);
        setRegistroFase(1);
    }

    return {
        usuario,
        setUsuario,

        cedula,
        setCedula,

        nombre,
        setNombre,

        apellido,
        setApellido,

        telefono,
        setTelefono,

        email,
        setEmail,

        password,
        setPassword,

        loading,
        modoRegistro,
        registroFase,

        handleLogin,
        handleRegister,
        siguienteFase,
        faseAnterior,
        cambiarModo,
    };
}