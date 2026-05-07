import { useState } from 'react'; //Para manejar estados dentro del hook
import { Alert } from 'react-native'; //Para mostrar mensajes emergentes al usuario
import { router } from 'expo-router'; //Para navegar entre pantallas
import { supabase } from '../lib/supabase'; //Config de SupaBase


type Rol = 'cliente' | 'operador' | 'admin'; //Definimos los roles


export function useLogin() { //Creamos un hook para el login

    const [usuario, setUsuario] = useState('');// Constante de estado para guardar el nombre ingresado en el registro
    const [email, setEmail] = useState('');// Constante de estado para guardar el correo ingresado
    const [password, setPassword] = useState(''); // Constante de estado para guardar la contraseña ingresada
    const [loading, setLoading] = useState(false); // Constante de estado para indicar si se está cargando la operación de login o el de registro
    const [modoRegistro, setModoRegistro] = useState(false); //Constante para saber si el formulario está en modo de registrar o en modo de iniciar sesión


    async function redirectByRole(userId: string) { //Creamos una función asíncrona para redirigir al usuario según su rol

        const { data: perfil, error } = await supabase // Hacemos la consulta en Supabase

            .from('perfiles') //Seleccionamos la tabla
            .select('id, usuario, rol, estado') //Seleccionamos las columnas     
            .eq('id', userId) //Filtramos el perfil mediante el ID, tiene que coincidir con el ID del usuario autenticado
            .single(); // Indica que solo puede recibir un registro


        if (error || !perfil) { //Validamos si hubo un error al encontrar el perfil 

            Alert.alert(
                'Perfil no encontrado',
                'El usuario existe en Auth, pero no tiene perfil en la tabla perfiles.'
            );

            return;// Detiene la ejecución de la función
        }

        // Verifica si el estado del perfil no es activo
        if (perfil.estado !== 'activo') { //Validación en caso de si el estado de perfil no está activo

            Alert.alert(
                'Cuenta inactiva',
                'Tu cuenta está desactivada. Contacta al administrador.'
            );

            await supabase.auth.signOut(); //Va a cerrar la sesión del usuario 
            return;// Detiene la ejecución de la función
        }

        const rol = perfil.rol as Rol; //Convertiremos el rol obtenido desde Supabase al tipo "Rol" (al inicio pusimos eso de type Rol = 'cliente' | 'operador' | 'admin';)


        if (rol === 'admin') { // Verifica si el rol del usuario es administrador

            router.replace('/administrador'); //le manda al panel del admin

        } else if (rol === 'operador') { // Verifica si el rol del usuario es operador

            router.replace('/operador');//le manda al panel del operador

        } else { // Si no es admin ni operador, se asume que es cliente

            router.replace('/cliente'); //le manda al panel del cliente
        }
    }


    async function handleLogin() { //Función asíncrona para iniciar sesión

        if (!email.trim() || !password.trim()) { //Valida si el correo o contraseña están vacíos

            Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
            return;// Detiene la ejecución de la función
        }


        try { //Creamos un try para manejar todos los errores que se me ocurrieron

            setLoading(true);// Activa el estado de cargando


            const { data, error } = await supabase.auth.signInWithPassword({ // Intentará iniciar sesión en Supabase con el correo y la contraseña

                email: email.trim(), // Envía el correo sin espacios al inicio o final
                password: password.trim(),// Envía la contraseña sin espacios al inicio o final

            });


            if (error) { //Valida si Supabase devolvió un error al iniciar sesión

                Alert.alert('Error al iniciar sesión', error.message);
                return;
            }


            if (!data.user) { //Valida si no se pudo obtener el usuario autenticado

                Alert.alert('Error', 'No se pudo obtener el usuario.');
                return;
            }

            await redirectByRole(data.user.id); //Redirige al usuario según su rol

        } catch (error) { //Captura cualquier error ocurrido en el try

            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al iniciar sesión.');

        } finally { //Se ejecutará siempre, existan errores o no

            setLoading(false);// Desactiva el estado de carga

        }
    }

    async function handleRegister() { //Creamos una función asíncrona que se encargará de registrar al usuario 

        if (!usuario.trim() || !email.trim() || !password.trim()) { // Validará si el nombre de usuario, correo o contraseña están vacíos

            Alert.alert('Campos incompletos', 'Ingresa tu nombre, correo y contraseña.');
            return;
        }


        if (password.trim().length < 6) { //Valida si la contraseña tiene menos de 6 caracteres (debe ser de 8 si o si)

            Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }


        try { //Creamos un try para el manejo de errores

            setLoading(true);// Activa el estado de carga

            const { data, error } = await supabase.auth.signUp({ //Creamos un nuevo usuario en Supabase auth con correo y contraseña

                email: email.trim(), //Enviamos el correo sin espacios al inicio o al final
                password: password.trim(),//Enviamos la contraseña sin espacios al inicio o al final

            });


            if (error) { //Valida si Supabase devuelve un error al registrar 

                Alert.alert('Error al registrarse', error.message);
                return;
            }

            if (!data.user) { //Valida si no se pudo crear u obtener el usuario

                Alert.alert('Error', 'No se pudo crear el usuario.');
                return;

            }

            const { error: perfilError } = await supabase //Insertamos el perfil del nuevo usuario en la tabla

                .from('perfiles') // Selecciona la tabla perfiles

                .insert({ // Inserta una nueva fila en la tabla perfiles

                    id: data.user.id,// Guardamos el mismo id del usuario creado en Supabase Auth

                    usuario: usuario.trim(),// Guarda el nombre de usuario ingresado, sin espacios al inicio o final

                    rol: 'cliente',//Asigna el rol por defecto (que es cliente) a los usuarios registrados desde la app

                    estado: 'activo', // Asigna el estado activo al nuevo usuario
                });

            if (perfilError) { // Valida si ocurrió un error al crear el perfíl

                Alert.alert('Usuario creado, pero falta perfil', perfilError.message);
                return;
            }

            Alert.alert('Cuenta creada', 'Tu cuenta fue creada correctamente.'); //Muestra una alerta en caso que se haya registrado bien
            await redirectByRole(data.user.id); //Redirige al usuario recién creado según su rol

        } catch (error) { //Capturamos los errores del try
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al registrarse.');


        } finally {  // Se ejecuta siempre, haya error o no
            setLoading(false);// Desactiva el estado de carga
        }
    }


    function limpiarFormulario() { //Función para limpiar los campos del formulario

        setUsuario(''); // Limpia el campo usuari
        setEmail(''); // Limpia el campo email
        setPassword(''); // Limpia el campo password

    }

    function cambiarModo() { //Función para cambiar entre modo login y modo registro

        limpiarFormulario();// Limpia todos los campos del formulario
        setModoRegistro(!modoRegistro); // Cambia el valor de modoRegistro al contrario del valor actual

    }


    return { // Retorna todos los estados y funciones que usará la pantalla de login

        usuario, // Devuelve el valor actual del usuario 
        setUsuario, // Devuelve la función para actualizar el usuario

        email, // Devuelve el valor actual del email
        setEmail, // Devuelve la función para actualizar el email

        password, // Devuelve el valor actual de la contraseña
        setPassword, // Devuelve la función para actualizar la contraseña

        loading, // Devuelve el estado de carga
        modoRegistro, // Devuelve si está en modo registro o no

        handleLogin, // Devuelve la función para iniciar sesión
        handleRegister, // Devuelve la función para registrar usuario
        cambiarModo, // Devuelve la función para cambiar entre login y registro
    };
}