// Importamos useState para guardar todo lo que el usuario tipea en las dos páginas de registro
import { useState } from 'react';
// Importamos CustomAlert para avisarle al usuario si le faltó llenar algo
import { CustomAlert } from '../../utils/AlertManager';
// Importamos AuthService para mandar todos los datos a la base de datos de Supabase
import { AuthService } from '../../services/AuthService';
// Importamos funciones que revisan que el correo, la cédula y el teléfono sean reales y no inventos
import { validarCorreo, validarCedula, validarTelefono } from '../../utils/validators';
// Importamos redirectByRole por si el usuario entra automáticamente después de registrarse
import { redirectByRole } from './authUtils';

// Sección
// Este archivo controla todo el proceso de crear una cuenta nueva
// Como el formulario es muy largo, se divide en dos fases y este archivo maneja ambas

// Funciones
// useRegisterForm: Es el director de la orquesta, junta todos los datos personales y las funciones
// limpiarFormulario: Borra todo lo que se escribió si el usuario se arrepiente y vuelve al inicio
// siguienteFase: Revisa que la página 1 esté completa y si es así, avanza a la página 2
// faseAnterior: Sirve como botón de "Atrás" para volver a la página 1 sin borrar los datos
// handleRegister: Agarra todo lo que el usuario escribió en las dos páginas y crea la cuenta de verdad

// (El gancho que maneja el registro)
export function useRegisterForm(onSuccessOrCancel?: () => void) {
    // (Todas estas variables guardan letrita por letrita lo que el usuario va escribiendo)
    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // (Este número dice en qué página del registro estamos: 1 o 2)
    const [registroFase, setRegistroFase] = useState(1);
    // (El spinner que da vueltas cuando mandamos los datos al servidor)
    const [loading, setLoading] = useState(false);

    // (La escoba que limpia todos los campos de texto)
    function limpiarFormulario() {
        setUsuario('');
        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setEmail('');
        setPassword('');
        // (Nos regresa a la página 1 por defecto)
        setRegistroFase(1);
    }

    // (La función que revisa el primer paso antes de dejarte pasar al segundo)
    function siguienteFase() {
        // (Revisamos que no haya dejado el apodo vacío)
        if (!usuario.trim()) {
            CustomAlert.alert('Error de Validación', 'El nombre de usuario es obligatorio');
            return;
        }

        // (Revisamos que haya escrito un correo)
        if (!email.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico es obligatorio');
            return;
        }

        // (Verificamos que sea un correo de verdad con su arroba)
        if (!validarCorreo(email)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido');
            return;
        }

        // (Revisamos que haya inventado una clave)
        if (!password.trim()) {
            CustomAlert.alert('Error de Validación', 'La contraseña es obligatoria');
            return;
        }

        // (Nadie quiere contraseñas fáciles como 123)
        if (password.trim().length < 6) {
            CustomAlert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // (Si todo está en orden, lo pasamos a la fase 2 para que llene sus datos personales)
        setRegistroFase(2);
    }

    // (El botón de regresar simple)
    function faseAnterior() {
        // (Solo cambia el número de página, no borra los datos)
        setRegistroFase(1);
    }

    // (La gran función que crea tu cuenta nueva en la base de datos)
    async function handleRegister() {
        // (Verificamos uno por uno los datos personales de la fase 2)
        if (!nombre.trim()) {
            CustomAlert.alert('Error de Validación', 'El nombre es obligatorio');
            return;
        }
        if (!apellido.trim()) {
            CustomAlert.alert('Error de Validación', 'El apellido es obligatorio');
            return;
        }
        if (!cedula.trim()) {
            CustomAlert.alert('Error de Validación', 'La cédula es obligatoria');
            return;
        }
        // (Confirmamos que la cédula tenga 10 números exactamente)
        if (!validarCedula(cedula)) {
            CustomAlert.alert('Error de Validación', 'La cédula debe tener exactamente 10 números numéricos');
            return;
        }
        if (!telefono.trim()) {
            CustomAlert.alert('Error de Validación', 'El teléfono es obligatorio');
            return;
        }
        // (Confirmamos que el teléfono tenga 10 números también)
        if (!validarTelefono(telefono)) {
            CustomAlert.alert('Error de Validación', 'El teléfono debe tener exactamente 10 números numéricos');
            return;
        }

        // (Si llegamos hasta aquí es porque llenó todo perfecto)
        try {
            // (Prendemos la ruedita de carga)
            setLoading(true);

            // (Empaquetamos toda la info personal en un solo bloque)
            const userData = {
                usuario: usuario.trim(),
                cedula: cedula.trim(),
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim(),
                correo: email.trim(),
            };

            // (Le decimos a Supabase que nos abra una cuenta nueva con esa info)
            const { data, error } = await AuthService.registrarse(
                email.trim(),
                password.trim(),
                userData
            );

            // (Si Supabase dice que ese correo ya existe o algo falla, mostramos el error)
            if (error) {
                // (Si es el error feo y en inglés de Supabase sobre la contraseña, lo traducimos a uno más amigable)
                if (error.message.includes('Password should contain at least one character of each')) {
                    CustomAlert.alert('Contraseña débil', 'La contraseña necesita contener al menos una letra mayúscula, una letra minúscula y un número');
                } else {
                    CustomAlert.alert('Error al registrarse', error.message);
                }
                return;
            }

            // (Por si acaso verificamos que el usuario sí se creó)
            if (!data.user) {
                CustomAlert.alert('Error', 'No se pudo crear el usuario');
                return;
            }

            // (Si Supabase está configurado para pedir que confirmes tu email primero)
            if (!data.session) {
                CustomAlert.alert(
                    'Cuenta creada',
                    'Tu cuenta fue creada correctamente (revisa tu correo si Supabase solicita confirmación y luego inicia sesión)'
                );

                // (Limpiamos todo y lo devolvemos a la pantalla principal)
                limpiarFormulario();
                if (onSuccessOrCancel) onSuccessOrCancel();
                return;
            }

            // (Si no pide confirmación entonces ya entraste oficialmente)
            CustomAlert.alert('Cuenta creada', 'Tu cuenta fue creada correctamente');
            // (Lo mandamos en el taxi a su pantalla de cliente)
            await redirectByRole(data.user.id);
        } catch (error) {
            // (Por si explota la app)
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al registrarse');
        } finally {
            // (Apagamos el spinner siempre)
            setLoading(false);
        }
    }

    // (Empaquetamos las variables y funciones para que la vista las use)
    return {
        usuario, setUsuario,
        cedula, setCedula,
        nombre, setNombre,
        apellido, setApellido,
        telefono, setTelefono,
        email, setEmail,
        password, setPassword,
        registroFase,
        loading,
        siguienteFase,
        faseAnterior,
        handleRegister,
        limpiarFormulario
    };
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas siguienteFase el usuario nunca podrá pasar a llenar su nombre y apellido porque el botón siguiente se quedará muerto)
(si quitas handleRegister la gente llenará todo el formulario pero su cuenta jamás existirá en la base de datos)
*/
