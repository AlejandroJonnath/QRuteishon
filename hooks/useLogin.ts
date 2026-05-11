// Importamos useState para guardar los datos que el usuario va escribiendo
import { useState } from 'react';
// Importamos Alert para mostrarle mensajitos de error o éxito al usuario en pantalla
import { Alert } from 'react-native';
// Importamos el router para mandarlo a otras pantallas cuando termine
import { router } from 'expo-router';
// Importamos la conexión a Supabase para comunicarnos con la base de datos
import { supabase } from '../lib/supabase';

// Definimos los tipos de roles que manejamos (para que TypeScript no llore después)
type Rol = 'cliente' | 'operador' | 'admin';

// Creamos nuestro super hook para manejar todo el login y registro
export function useLogin() {
    // Estados para guardar lo que escriben en el formulario de registro
    // (usuario, cédula, nombre, etc)
    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');

    // Estados exclusivos para el correo y la clave
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Un estado para mostrar la ruedita de carga cuando estamos esperando a la base de datos
    const [loading, setLoading] = useState(false);

    // Estado para saber si le mostramos el formulario de registro o el de login
    const [modoRegistro, setModoRegistro] = useState(false);

    // Estado para dividir el registro en dos pasitos (1 o 2) para que no se vea tan largo
    const [registroFase, setRegistroFase] = useState(1);

    // Esta función busca qué rol tiene el usuario y lo manda a su panel correspondiente
    async function redirectByRole(userId: string) {
        // Buscamos el perfil en la base de datos usando el ID del usuario
        const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('id, usuario, rol, estado')
            .eq('id', userId)
            .single();

        // Si hubo un error o no se encontró el perfil le avisamos al usuario
        if (error || !perfil) {
            Alert.alert(
                'Perfil no encontrado',
                'El usuario existe en Auth pero todavía no se encontró su perfil (intenta iniciar sesión nuevamente)'
            );
            return;
        }

        // Revisamos si la cuenta está suspendida o inactiva
        if (perfil.estado !== 'activo') {
            Alert.alert(
                'Cuenta inactiva',
                'Tu cuenta está desactivada (contacta al administrador)'
            );

            // Lo deslogueamos por si acaso
            await supabase.auth.signOut();
            return;
        }

        // Casteamos el rol para que TypeScript sepa qué valores puede tener
        const rol = perfil.rol as Rol;

        // Lo mandamos a su panel según el rol que tenga
        if (rol === 'admin') {
            router.replace('/administrador');
        } else if (rol === 'operador') {
            router.replace('/operador');
        } else {
            router.replace('/cliente');
        }
    }

    // Función que se ejecuta cuando tocan el botón de iniciar sesión
    async function handleLogin() {
        // Validamos que no nos manden campos vacíos (el trim quita los espacios en blanco)
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña');
            return;
        }

        try {
            // Prendemos la ruedita de carga
            setLoading(true);

            // Le decimos a Supabase que inicie sesión con estos datos
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            // Si Supabase nos tira un error lo mostramos en un mensajito
            if (error) {
                Alert.alert('Error al iniciar sesión', error.message);
                return;
            }

            // Validamos que realmente haya vuelto un usuario
            if (!data.user) {
                Alert.alert('Error', 'No se pudo obtener el usuario');
                return;
            }

            // Si todo salió bien lo mandamos a su panel
            await redirectByRole(data.user.id);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al iniciar sesión');
        } finally {
            // Apagamos la ruedita de carga pase lo que pase
            setLoading(false);
        }
    }

    // Función para pasar a la segunda parte del formulario de registro
    function siguienteFase() {
        // Validamos que llenen la primera parte
        if (!usuario.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Ingresa usuario, correo y contraseña para continuar');
            return;
        }

        // Validamos que la clave no sea tan corta
        if (password.trim().length < 6) {
            Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Pasamos a la fase 2
        setRegistroFase(2);
    }

    // Función para regresar a la primera parte del formulario
    function faseAnterior() {
        setRegistroFase(1);
    }

    // Función que se dispara cuando tocan el botón final de registrarse
    async function handleRegister() {
        // Verificamos que absolutamente todos los campos estén llenos
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
                'Ingresa todos tus datos personales, correo y contraseña'
            );
            return;
        }

        // Doble chequeo de la clave por si acaso
        if (password.trim().length < 6) {
            Alert.alert(
                'Contraseña débil',
                'La contraseña debe tener al menos 6 caracteres'
            );
            return;
        }

        try {
            // Prendemos la ruedita de carga
            setLoading(true);

            // Le pedimos a Supabase que nos cree la cuenta
            // (le pasamos los datos extra en el options.data para que un trigger en la base de datos cree el perfil solito)
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

            // Si falla la creación mostramos el error
            if (error) {
                Alert.alert('Error al registrarse', error.message);
                return;
            }

            // Validamos que se haya creado el usuario
            if (!data.user) {
                Alert.alert('Error', 'No se pudo crear el usuario');
                return;
            }

            // Si Supabase pide confirmar el correo por email la sesión viene vacía
            // (entonces le avisamos al usuario que vaya a revisar su correo)
            if (!data.session) {
                Alert.alert(
                    'Cuenta creada',
                    'Tu cuenta fue creada correctamente (revisa tu correo si Supabase solicita confirmación y luego inicia sesión)'
                );

                // Lo mandamos de vuelta al login y limpiamos todo
                setModoRegistro(false);
                limpiarFormulario();
                return;
            }

            // Si no pide confirmación de correo le decimos que todo joya
            Alert.alert(
                'Cuenta creada',
                'Tu cuenta fue creada correctamente'
            );

            // Y lo mandamos de una a su panel
            await redirectByRole(data.user.id);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al registrarse');
        } finally {
            // Apagamos la ruedita de carga
            setLoading(false);
        }
    }

    // Función para borrar todo lo que escribieron en los campos
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

    // Función para intercambiar entre la pantalla de login y la de registro
    function cambiarModo() {
        limpiarFormulario();
        setModoRegistro(!modoRegistro);
        setRegistroFase(1);
    }

    // Exportamos todas estas variables y funciones para que la pantalla pueda usarlas
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