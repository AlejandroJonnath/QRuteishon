// Importamos useEffect de React para ejecutar cosas cuando cambian ciertos datos
import { useEffect } from 'react';
// Importamos router de expo para poder mover al usuario de una pantalla a otra
import { router } from 'expo-router';
// Nos traemos el hook de autenticación para saber quién está logueado
import { useAuth } from '../context/AuthContext';

// Creamos nuestro hook que se encarga de mandar a cada quien a su panel
export function useIndexLogic() {

    // Sacamos la sesión, el perfil y si está cargando desde el contexto de autenticación
    // (esto nos dice si el usuario existe y qué rol tiene)
    const { session, perfil, loading } = useAuth();

    // Usamos useEffect para que esta lógica corra cada vez que cambie algo de la sesión o el perfil
    useEffect(() => {

        // Si todavía está cargando la info de auth no hacemos nada y esperamos
        if (loading) return;


        // Si no hay ninguna sesión activa mandamos al usuario de una a que inicie sesión
        if (!session) {
            
            // Reemplazamos la pantalla actual por el login (para que no pueda volver atrás con el botón del celu)
            router.replace('/login');
            return;
        }


        // Si inició sesión pero por alguna razón no tiene perfil también lo mandamos al login
        if (!perfil) {

            router.replace('/login');
            return;
        }


        // Verificamos si la cuenta está activa (si lo suspendieron, lo mandamos a volar al login)
        if (perfil.estado !== 'activo') {

            router.replace('/login');
            return;
        }


        // Si el usuario tiene rol de admin lo mandamos a su panel de administración
        if (perfil.rol === 'admin') {

            router.replace('/administrador');


        // Si es operador lo mandamos al panel de operador
        } else if (perfil.rol === 'operador') {

            router.replace('/operador');


        // Si no es ni admin ni operador asumimos que es cliente y lo mandamos para allá
        } else {

            router.replace('/cliente');

        }

        // Le pasamos las dependencias al useEffect (se vuelve a ejecutar si cambia alguna de estas)
    }, [session, perfil, loading]);

    // Retornamos un objeto vacío porque este hook solo hace las redirecciones y no devuelve datos
    return {};
}