import { useEffect } from 'react'; //usaremos useEffect para ejecutar la lógica cuando cambien ciertos valores
import { router } from 'expo-router';// Importamos el router de expo para redirigir al user entre pantallas
import { useAuth } from '../context/AuthContext'; //Importamos el hook que hicimos en context para acceder a la sesión, perfíl y el estado de carga


type Rol = 'cliente' | 'operador' | 'admin'; //Definimos los roles


export function useRequireRole(requiredRole: Rol) { //Vamos a crear un hook que exija al usuario tener un rol específico

    const { session, perfil, loading } = useAuth(); //Obtendremos la sesión, el eprfil y el estado de carga del contexto del auth

    useEffect(() => { //Ejecutaremos las validaciones cada vez que cambie de sesión, perfil, carga y requerimiento del rol

        if (loading) return; //esperará si sigue cargando


        if (!session) { //Si no hay sesión activa, redirige al user al login

            router.replace('/login'); //con esto le mandamos para el login xd
            return; //detiene la ejecución para que no siga validando
        }

        if (!perfil) { //Si no existe perfil cargado, le manda al login

            router.replace('/login');
            return;
        }

        if (perfil.estado !== 'activo') { //Si el perfil del usuario no está activo, lo manda al login

            router.replace('/login');
            return;
        }

        if (perfil.rol !== requiredRole) { // Si el rol del perfil no coincide con el rol requerido, lo manda al incio de su panel

            router.replace('/'); // esto es para mandarle al inicio cuando tenga la sesión cargada, así le mandará directamente a su panel en caso que sea otro rol
        }

    }, [session, perfil, loading, requiredRole]); //listamos las dependencias: el efecto se vuelve a ejecutar si cambia alguno de estos valores

    return { session, perfil, loading }; //Retornamos la sesión, el perfil y el estado de carga para usarlos en el componente que vaya a llamar a este hook
}