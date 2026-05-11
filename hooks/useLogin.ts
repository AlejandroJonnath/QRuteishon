import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '../services/AuthService';
import type { Rol } from '../services/AuthService';

export function useLogin() {
    // Guardamos lo que el usuario va escribiendo
    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Ruedita de carga para avisar que estamos procesando
    const [loading, setLoading] = useState(false);

    // Cambiamos entre pantalla de login o la de registrarse
    const [modoRegistro, setModoRegistro] = useState(false);

    // Dividimos el registro en dos partes para que no se vea tan pesado
    const [registroFase, setRegistroFase] = useState(1);

    // Redirige al usuario a su panel correspondiente según el rol
    async function redirectByRole(userId: string) {
        const { data: perfil, error } = await AuthService.obtenerPerfil(userId);

        if (error || !perfil) {
            Alert.alert(
                'Perfil no encontrado',
                'El usuario existe en Auth pero todavía no se encontró su perfil (intenta iniciar sesión nuevamente)'
            );
            return;
        }

        // Revisamos si no lo banearon
        if (perfil.estado !== 'activo') {
            Alert.alert(
                'Cuenta inactiva',
                'Tu cuenta está desactivada (contacta al administrador)'
            );

            await AuthService.cerrarSesion();
            return;
        }

        const rol = perfil.rol as Rol;

        // Mandamos a cada quien pa su casa
        if (rol === 'admin') {
            router.replace('/administrador');
        } else if (rol === 'operador') {
            router.replace('/operador');
        } else {
            router.replace('/cliente');
        }
    }

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña');
            return;
        }

        try {
            setLoading(true);

            // Llamamos a nuestro servicio para iniciar sesión en lugar de hablar directo con la base
            const { data, error } = await AuthService.iniciarSesion(
                email.trim(),
                password.trim()
            );

            if (error) {
                Alert.alert('Error al iniciar sesión', error.message);
                return;
            }

            if (!data.user) {
                Alert.alert('Error', 'No se pudo obtener el usuario');
                return;
            }

            await redirectByRole(data.user.id);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al iniciar sesión');
        } finally {
            setLoading(false);
        }
    }

    function siguienteFase() {
        if (!usuario.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Ingresa usuario, correo y contraseña para continuar');
            return;
        }

        if (password.trim().length < 6) {
            Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setRegistroFase(2);
    }

    function faseAnterior() {
        setRegistroFase(1);
    }

    async function handleRegister() {
        // (Verificamos que no falte absolutamente ningún dato personal)
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

        if (password.trim().length < 6) {
            Alert.alert(
                'Contraseña débil',
                'La contraseña debe tener al menos 6 caracteres'
            );
            return;
        }

        try {
            setLoading(true);

            const userData = {
                usuario: usuario.trim(),
                cedula: cedula.trim(),
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim(),
                correo: email.trim(),
            };

            // Pasamos todos los datos a nuestro servicio de registro
            const { data, error } = await AuthService.registrarse(
                email.trim(),
                password.trim(),
                userData
            );

            if (error) {
                Alert.alert('Error al registrarse', error.message);
                return;
            }

            if (!data.user) {
                Alert.alert('Error', 'No se pudo crear el usuario');
                return;
            }

            // Si pide confirmación de correo la sesión viene vacía
            if (!data.session) {
                Alert.alert(
                    'Cuenta creada',
                    'Tu cuenta fue creada correctamente (revisa tu correo si Supabase solicita confirmación y luego inicia sesión)'
                );

                setModoRegistro(false);
                limpiarFormulario();
                return;
            }

            Alert.alert(
                'Cuenta creada',
                'Tu cuenta fue creada correctamente'
            );

            await redirectByRole(data.user.id);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al registrarse');
        } finally {
            setLoading(false);
        }
    }

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