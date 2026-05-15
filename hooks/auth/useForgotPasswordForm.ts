// Importamos useState para crear variables que cuando cambian avisan a React que debe redibujar la pantalla
import { useState } from 'react';
// Importamos CustomAlert para mostrar ventanitas de mensajes de error o éxito al usuario
import { CustomAlert } from '../../utils/AlertManager';
// Importamos AuthService para hablar con el backend y preguntar si el correo existe
import { AuthService } from '../../services/AuthService';
// Importamos AdminService porque tiene el superpoder de cambiar contraseñas directamente
import { AdminService } from '../../services/AdminService';
// Importamos validarCorreo para asegurarnos de que el texto ingresado sí parece un correo de verdad
import { validarCorreo } from '../../utils/validators';

// Sección
// Este archivo contiene toda la lógica oculta detrás de la pantalla de "Olvidé mi contraseña"
// Se encarga de revisar que el correo sea válido, simular el envío del código y guardar la nueva clave

// Funciones
// useForgotPasswordForm: Es el cerebro del formulario, guarda todos los textos que el usuario escribe y tiene las funciones para procesarlos
// limpiarFormulario: Sirve para borrar todo lo que el usuario haya escrito (como una escoba que limpia los campos)
// procesarCorreoRecuperacion: Revisa si el correo existe en la base de datos y avanza a la siguiente pantalla si todo está bien
// guardarNuevaContrasena: Toma la nueva clave que escribió el usuario, verifica que sea segura y la guarda en la base de datos

// (El gancho que controla la recuperación de contraseña)
export function useForgotPasswordForm(onSuccessOrCancel?: () => void) {
    // (Aquí guardamos lo que el usuario escribe en el campo del correo)
    const [email, setEmail] = useState('');
    // (Aquí guardamos la contraseña nueva que quiere poner)
    const [nuevaPassword, setNuevaPassword] = useState('');
    // (Aquí guardamos la repetición de la contraseña para comprobar que no se equivocó al teclearla)
    const [confirmarPassword, setConfirmarPassword] = useState('');
    // (Nos dice en qué pantalla de recuperación estamos, 1 es pedir correo, 2 es pantalla de carga, 3 es pedir clave nueva)
    const [recuperacionFase, setRecuperacionFase] = useState(1);
    // (Guardamos el ID oculto del usuario para saber a quién le vamos a cambiar la contraseña al final)
    const [usuarioRecuperacionId, setUsuarioRecuperacionId] = useState('');
    // (La ruedita que gira para decirle al usuario que espere y la app no se ha trabado)
    const [loading, setLoading] = useState(false);

    // (La función escoba que borra todo si el usuario se arrepiente)
    function limpiarFormulario() {
        setEmail('');
        setNuevaPassword('');
        setConfirmarPassword('');
        setRecuperacionFase(1);
        setUsuarioRecuperacionId('');
    }

    // (La función que revisa a quién le pertenece el correo cuando se les olvida la clave)
    async function procesarCorreoRecuperacion() {
        // (Verificamos que no nos hayan dejado el cuadro de texto vacío)
        if (!email.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico es obligatorio');
            return;
        }

        // (Confirmamos que el correo tenga arroba y punto algo, para no buscar basura en la base de datos)
        if (!validarCorreo(email)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido');
            return;
        }

        try {
            // (Prendemos la ruedita de carga)
            setLoading(true);

            // (Buscamos si este correo existe en nuestra tabla principal de usuarios)
            const { data, error } = await AuthService.verificarCorreoRecuperacion(email.trim());

            // (Si hubo error o nadie tiene ese correo, lo rebotamos)
            if (error || !data) {
                CustomAlert.alert('Error', 'No se encontró ninguna cuenta con este correo');
                setLoading(false);
                return;
            }

            // (Bloqueo de seguridad para que nadie pueda pedir cambiarle la clave al jefe o a los trabajadores)
            if (data.rol === 'admin' || data.rol === 'operador') {
                CustomAlert.alert(
                    'Cuenta corporativa',
                    'Su correo es una cuenta corporativa de nuestra institución, póngase en contacto con TICS'
                );
                setLoading(false);
                return;
            }

            // (Si es un cliente normal procedemos a atrapar su ID secreto)
            setUsuarioRecuperacionId(data.id);
            // (Lo pasamos a la fase 2 que es la pantalla de carga falsa)
            setRecuperacionFase(2);
            // (Apagamos la ruedita del botón)
            setLoading(false);

            // (Lo hacemos esperar 10 segunditos para simular seguridad o envío de algo)
            setTimeout(() => {
                // (Le decimos que todo bien)
                CustomAlert.alert('Correo Verificado', 'Tu correo ha sido verificado correctamente');
                // (Lo pasamos a la fase 3 donde pone su clave nueva)
                setRecuperacionFase(3);
            }, 10000);

        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error', 'Ocurrió un problema al verificar el correo');
            setLoading(false);
        }
    }

    // (El último paso donde machacamos la clave vieja con la nueva)
    async function guardarNuevaContrasena() {
        // (Validamos que hayan escrito algo en el primer cuadro)
        if (!nuevaPassword.trim()) {
            CustomAlert.alert('Error de Validación', 'La nueva contraseña es obligatoria');
            return;
        }

        // (Validamos que hayan escrito algo en el segundo cuadro)
        if (!confirmarPassword.trim()) {
            CustomAlert.alert('Error de Validación', 'Debes confirmar la contraseña');
            return;
        }

        // (Si se le chispoteó una tecla y no son exactamente iguales lo detenemos)
        if (nuevaPassword !== confirmarPassword) {
            CustomAlert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        // (No le dejamos poner contraseñas muy cortas por seguridad)
        if (nuevaPassword.length < 6) {
            CustomAlert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            // (Prendemos la ruedita de carga)
            setLoading(true);
            // (Usamos los superpoderes de AdminService para forzar el cambio en Supabase usando el ID que guardamos antes)
            const { error } = await AdminService.forzarCambioContrasena(usuarioRecuperacionId, nuevaPassword);

            // (Si hubo un error técnico avisamos)
            if (error) {
                // (Si es el error feo y en inglés de Supabase sobre la contraseña, lo traducimos a uno más amigable)
                if (error.message.includes('Password should contain at least one character of each')) {
                    CustomAlert.alert('Contraseña débil', 'La contraseña necesita contener al menos una letra mayúscula, una letra minúscula y un número');
                } else {
                    CustomAlert.alert('Error', 'No se pudo cambiar la contraseña: ' + error.message);
                }
                return;
            }

            // (Celebramos y limpiamos todo)
            CustomAlert.alert('Éxito', 'Tu contraseña ha sido actualizada correctamente. Inicia sesión con tu nueva contraseña');
            limpiarFormulario();
            // (Le avisamos a la pantalla principal que ya terminamos para que lo devuelva al login)
            if (onSuccessOrCancel) onSuccessOrCancel();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error', 'Ocurrió un problema inesperado');
        } finally {
            // (Pase lo que pase apagamos la ruedita)
            setLoading(false);
        }
    }

    // (Empaquetamos todo este reguero de variables y funciones para que la pantalla visual las pueda usar)
    return {
        email, setEmail,
        nuevaPassword, setNuevaPassword,
        confirmarPassword, setConfirmarPassword,
        recuperacionFase,
        loading,
        procesarCorreoRecuperacion,
        guardarNuevaContrasena,
        limpiarFormulario
    };
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas procesarCorreoRecuperacion el usuario no podrá avanzar de la primera pantalla de olvidar contraseña y jamás le verificará su correo)
(si quitas guardarNuevaContrasena el usuario escribirá sus dos claves nuevas pero el botón guardar no hará nada y su cuenta seguirá con la clave vieja)
(si quitas limpiarFormulario cuando el usuario se arrepienta de cambiar la clave y luego vuelva a entrar los datos viejos seguirán ahí manchando la pantalla)
*/
