// Importamos useState para guardar lo que el usuario va escribiendo
import { useState } from 'react';
// Importamos CustomAlert para que la app pueda mandar alertas emergentes de colores
import { CustomAlert } from '@/utils/AlertManager';
// Importamos AuthService para comprobar el correo y la contraseña contra Supabase
import { AuthService } from '@/services/AuthService';
// Importamos validarCorreo para asegurarnos de que el texto ingresado sí parece un correo de verdad
import { validarCorreo } from '@/utils/validators';
// Importamos router para poder redirigir al usuario al index luego de iniciar sesión
import { router } from 'expo-router';

// Sección
// Este archivo es el corazón de la pestaña de iniciar sesión
// Se encarga únicamente de recoger el correo y la contraseña para mandárselos al servidor

// Funciones
// useLoginForm: El gancho que junta todas las piezas (variables y funciones) de esta pantalla
// handleLogin: La función maestra que se dispara cuando presionan el botón azul de ingresar

// (El gancho que controla la pantalla principal de entrar a la app)
export function useLoginForm() {
    // (Aquí se guarda el correo a medida que lo escriben)
    const [email, setEmail] = useState('');
    // (Aquí se guarda la contraseña oculta con puntitos)
    const [password, setPassword] = useState('');
    // (Esta variable es el spinner dando vueltas para que la pantalla no se quede congelada)
    const [loading, setLoading] = useState(false);

    // (La función que se dispara cuando le picas al botón de Iniciar Sesión)
    async function handleLogin() {
        // (Verificamos que no hayan dejado el correo en blanco)
        if (!email.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico es obligatorio');
            return;
        }

        // (Confirmamos que el correo parezca un correo real con su arroba)
        if (!validarCorreo(email)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido');
            return;
        }

        // (Verificamos que haya escrito una clave)
        if (!password.trim()) {
            CustomAlert.alert('Error de Validación', 'La contraseña es obligatoria');
            return;
        }

        // (Intentamos entrar a la app)
        try {
            // (Prendemos la ruedita de carga)
            setLoading(true);

            // (Tocamos la puerta de Supabase con el correo y la clave)
            const { data, error } = await AuthService.iniciarSesion(
                email.trim(),
                password.trim()
            );

            // (Si Supabase nos rebota porque la clave está mal, le avisamos al usuario)
            if (error) {
                CustomAlert.alert('Error al iniciar sesión', error.message);
                setLoading(false);
                return;
            }

            // (Por si acaso verificamos que el usuario sí llegó en la respuesta secreta)
            if (!data.user) {
                CustomAlert.alert('Error', 'No se pudo obtener el usuario');
                setLoading(false);
                return;
            }

            // (Login exitoso: apagamos el spinner y redirigimos a la pantalla de carga principal '/')
            // (Allí, useIndexLogic esperará a que AuthContext termine de cargar el perfil y decidirá a qué panel enviarnos)
            setLoading(false);
            router.replace('/');
        } catch (error) {
            // (Por si el internet se corta de golpe o explota el servidor)
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al iniciar sesión');
            setLoading(false);
        }
    }

    // (La función que maneja el inicio de sesión con Google o Microsoft)
    async function handleOAuthLogin(provider: 'google' | 'azure') {
        try {
            setLoading(true);
            const { error } = await AuthService.iniciarSesionOAuth(provider);
            
            if (error) {
                // Si cancelan el modal, el error suele decir "cancelado" o similar, no siempre es un fallo grave.
                if (error.message !== 'Inicio de sesión cancelado por el usuario') {
                    CustomAlert.alert(`Error al conectar con ${provider === 'google' ? 'Google' : 'Microsoft'}`, error.message);
                }
                setLoading(false);
                return;
            }

            // Si todo sale bien, la sesión ya está guardada y redirigimos
            setLoading(false);
            router.replace('/');
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema con el inicio de sesión social');
            setLoading(false);
        }
    }

    // (Empaquetamos todo para mandarlo de vuelta a la parte visual)
    return {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        handleLogin,
        handleOAuthLogin // (Exportamos la nueva función)
    };
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas handleLogin el botón gigante de ingresar no hará absolutamente nada y la app será inútil)
*/
