import { useEffect } from 'react'; // Usare esto para cambiar ciertos valores después
import { router } from 'expo-router'; //lo usaré para redirigir al usuario entre pantallas
import { useAuth } from '../context/AuthContext'; //Importamos el hook para autenticar

export function useIndexLogic() { //Creamos el hook para poder hacer el movimiento de páneles

    const { session, perfil, loading } = useAuth(); //Obtenemos la sesión actual, el perfil del usuario y el estado de carga desde el contexto de auth

    useEffect(() => { //Ejecutamos esta lógica cada vez que cambien de sesión, perfil o carga

        if (loading) return; //En caso que siga cargando la info de auth, no hará nada aún


        if (!session) { //En caso que no exista una sesión activa, le manda al login al usuario

            router.replace('/login'); //Reemplaza la pantalla actual de la app por el login de la app
            return;
        }


        if (!perfil) { //Si no existe un perfil, redirige al usuario para el login

            router.replace('/login');
            return;
        }


        if (perfil.estado !== 'activo') { // Si el perfil no está activo, se redirige al login

            router.replace('/login');
            return;
        }


        if (perfil.rol === 'admin') {// Validación si el rol del usuario es Admin

            router.replace('/administrador'); // Redirige al panel del administrador


        } else if (perfil.rol === 'operador') { // Valida si el rol del usuario es Operador

            router.replace('/operador'); // Redirige al panel del operador


        } else { // Si no es admin ni operador, se asume que es cliente

            router.replace('/cliente'); // Redirige al panel del cliente

        }

        // Lista de dependencias: el efecto se vuelve a ejecutar si cambia alguno de estos valores
    }, [session, perfil, loading]);

    // Retorna un objeto vacío porque este hook solo se encarga de la lógica de redirección
    return {};
}