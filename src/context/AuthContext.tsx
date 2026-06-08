import React, { createContext, useContext, useEffect, useState } from 'react'; // Necesitamos crear contexto de auth, usar el auth, usar efectos y usar estados (activo o inactivo)
import { Session } from '@supabase/supabase-js'; //Traemos la sesión desde supabase
import { supabase } from '@/lib/supabase'; //Importamos la conexión de supabase que tenemos en el supabase.ts

type Rol = 'cliente' | 'operador' | 'admin'; //Definimos los roles que tenemos en el supabase (exactamente como están escritos allá)

type Perfil = { // Vamos a definir la estructura que tendrá el perfil del usuario

    id: string; // Gyarda el id del usuario (todo debe coincidir con el id de supabase)
    usuario: string | null; // guarda el username, puede ser texto o nulo
    rol: Rol; //guardamos el rol del usuario (cliente, operador o admin)
    estado: 'activo' | 'inactivo'; //guardamos el estado del usuario (para esto servirá el Use state)
    cedula: string | null;
    telefono: string | null;
};

type AuthContextType = { //Aquí definiré la estructura de los datos y las funciones que tendrá el contexto del auth

    session: Session | null; // Guardamos la sesión del usuario (será null en caso que no haya iniciado sesión)
    perfil: Perfil | null; // guardamos el perfil del usuario que está en ese momento, le pongo null en caso que no haya el usuario o no le cargue el perfil
    loading: boolean; // indicará si está cargando la sesión o el perfil
    signOut: () => Promise<void>; //Esta promesa dentro de este método será para para cerrar sesión
    loadPerfil: (userId: string) => Promise<Perfil | null>; //Hacemos la función para cargar el perfil del usuario usando su ID
};


const AuthContext = createContext<AuthContextType | null>(null); // Con esto vamos a crear el contexto del auth, al inicio será nulo


export function AuthProvider({ children }: { children: React.ReactNode }) { // Aquí vamos a crear el proveedor del auth que tendrá la app

    const [session, setSession] = useState<Session | null>(null); // Creamos una constante de estado para guardar la sesión actual del usuario
    const [perfil, setPerfil] = useState<Perfil | null>(null); //Creamos una constante de estado para guardar el perfil del usuario actual
    const [loading, setLoading] = useState(true); // Creamos una variable de estado para salir si la autenticación aún sigue cargando

    async function loadPerfil(userId: string) { // Crearemos una función asíncrona para cargar el perfil del usuario desde supabase

        const { data, error } = await supabase //Hacemos la consulta SQL de perfiles a Supabase

            .from('perfiles') //Seleccionamos la tabla
            .select('id, usuario, rol, estado, cedula, telefono') //Seleccionamos las columnas
            .eq('id', userId) // Filtraremos el perfil donde el ID sea igual que el ID del usuario autenticado
            .single(); // con esto indicamos que solo esperamos recibir un registro (una petición)


        if (error) { //Manejo de errores

            console.log('Error cargando perfil:', error.message); //msg de la consola para mostrar el error
            setPerfil(null); // Limpiamos el perfil guardado en el estado
            return null; //retornamos nulo porque no se pudo cargar el perfil
        }

        const userPerfil = data as Perfil; //Convertirá los datos recibidos desde supabase a tipo Perfil

        setPerfil(userPerfil); //guarda el perfil cargado en el estado
        return userPerfil; //retorna el perfil cargado
    }


    useEffect(() => {
        // Registramos el listener PRIMERO (práctica recomendada por Supabase).
        // Ignoramos INITIAL_SESSION porque loadSession() ya maneja el arranque
        // completo: así evitamos que loading=false se emita dos veces con perfil=null
        // en el medio, que era la causa del parpadeo al iniciar sesión.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, currentSession) => {

            // (El evento inicial ya lo maneja loadSession; lo ignoramos aquí)
            if (event === 'INITIAL_SESSION') return;

            // En flujos OAuth, a veces se disparan múltiples eventos rápidamente.
            // Solo bloqueamos si realmente hay un usuario nuevo que cargar.
            setSession(currentSession);

            if (currentSession?.user) {
                setLoading(true);
                // Eliminamos el setTimeout(100) inseguro.
                // Manejamos la asincronía directamente con Promesas para evitar condiciones de carrera.
                loadPerfil(currentSession.user.id)
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                setPerfil(null);
                setLoading(false);
            }
        });

        // (loadSession maneja la carga inicial: sesión + perfil + loading=false)
        async function loadSession() {
            try {
                const { data } = await supabase.auth.getSession();
                setSession(data.session);

                if (data.session?.user) {
                    await loadPerfil(data.session.user.id);
                }
            } finally {
                setLoading(false);
            }
        }

        loadSession();

        return () => {
            subscription.unsubscribe();
        };
    }, []);


    async function signOut() { //Función asíncrona para cerrar sesión

        await supabase.auth.signOut();// cerramos la sesión del usuario en supabase

        setSession(null); //limpia la sesión guardada en el estado local

        setPerfil(null); //lo mismo que arriba pero del perfil xd
    }


    return ( //vamos a retornar el proveedor del contexto con los valores que estarán disponibles toda la app

        <AuthContext.Provider //Envolverá a los componentes hijos con el contexto de auth

            value={{ //Definimos los datos y funciones que podrán usar los componentes hijos

                session, //compartiremos la sesión

                perfil, //compartiremos el perfil actual

                loading, //compartiremos el estado de carga 

                signOut, //compartiremos la función para cerrar sesión

                loadPerfil, //compartiremos la función para cargar el perfil
            }}
        >
            {/* Renderiza todos los componentes hijos dentro del proveedor */}
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() { //Creamos un hook para usar fácilmente el contexto de auth

    const context = useContext(AuthContext); //Obtiene el contexto del auth

    if (!context) { //Verificamos si el hook se está usando fuera del AuthProvider

        throw new Error('useAuth debe usarse dentro de AuthProvider'); //Lanzamos un error si useAuth no está dentro del provider
    }

    return context; //retornamos el contexto de la autenticación
}