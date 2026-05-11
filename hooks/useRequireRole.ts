// Importamos useEffect para correr nuestra lógica cada vez que cambien los datos importantes
import { useEffect } from 'react';
// Importamos el router de expo para mandar al usuario a otra pantalla si no tiene el rol
import { router } from 'expo-router';
// Nos traemos nuestro hook de autenticación para ver quién está conectado y sus datos
import { useAuth } from '../context/AuthContext';


// Definimos los tres roles que manejamos en la app para no equivocarnos al escribirlos
type Rol = 'cliente' | 'operador' | 'admin';


// Creamos un hook que funciona como un cadenero (exige un rol específico para dejarte pasar)
export function useRequireRole(requiredRole: Rol) {

    // Sacamos la sesión, el perfil y si está cargando desde nuestro contexto de autenticación
    const { session, perfil, loading } = useAuth();

    // Usamos useEffect para validar todo cada vez que cambie algo (como si el usuario se desloguea)
    useEffect(() => {

        // Si todavía está cargando esperamos un ratito y no hacemos nada
        if (loading) return;


        // Si vemos que no hay nadie conectado lo mandamos volando al login
        if (!session) {

            // El replace hace que no puedan volver atrás con el botón del teléfono
            router.replace('/login');
            // Cortamos acá para que no siga leyendo el código
            return;
        }

        // Si por alguna razón no se cargó el perfil también lo mandamos al login
        if (!perfil) {

            router.replace('/login');
            return;
        }

        // Si la cuenta está desactivada o suspendida lo mandamos de vuelta al login
        if (perfil.estado !== 'activo') {

            router.replace('/login');
            return;
        }

        // Acá viene lo importante (si el rol que tiene no es el que pedimos lo mandamos al inicio)
        if (perfil.rol !== requiredRole) {

            // Mandarlo a la raíz hace que el index se encargue de mandarlo a su panel correcto
            router.replace('/');
        }

    // Le pasamos las dependencias para que vuelva a chequear si cambia alguna de estas variables
    }, [session, perfil, loading, requiredRole]);

    // Retornamos estos datos por si el componente que usa el hook los necesita para mostrar algo
    return { session, perfil, loading };
}