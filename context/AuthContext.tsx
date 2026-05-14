import React, { createContext, useContext, useEffect, useState } from 'react'; // Necesitamos crear contexto de auth, usar el auth, usar efectos y usar estados (activo o inactivo)
import { Session } from '@supabase/supabase-js'; //Traemos la sesión desde supabase
import { supabase } from '../lib/supabase'; //Importamos la conexión de supabase que tenemos en el supabase.ts

type Rol = 'cliente' | 'operador' | 'admin'; //Definimos los roles que tenemos en el supabase (exactamente como están escritos allá)

type Perfil = { // Vamos a definir la estructura que tendrá el perfil del usuario

    id: string; // Gyarda el id del usuario (todo debe coincidir con el id de supabase)
    usuario: string | null; // guarda el username, puede ser texto o nulo
    rol: Rol; //guardamos el rol del usuario (cliente, operador o admin)
    estado: 'activo' | 'inactivo'; //guardamos el estado del usuario (para esto servirá el Use state)
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
            .select('id, usuario, rol, estado') //Seleccionamos las columnas
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


    useEffect(() => { //Ejecuta toda la lógica de manera automática cuando el componente AuthProvider se monta

        async function loadSession() { // Definimos una función asíncrona para cargar la sesión actual

            const { data } = await supabase.auth.getSession(); //Obtenemos la sesión actual guardada en supabase


            setSession(data.session); //Guarda la sesión actual en el estado


            if (data.session?.user) { //Verificación para ver si existe una sesión y usuario autenticado

                await loadPerfil(data.session.user.id); //Cargamos el perfil del usuario autenticado usando su ID
            }

            setLoading(false); //Indica que ya termino la primera carga xd
        }

        loadSession(); // Ejecutamos la función que cargará la sesión inicial

        const { // Creamos una constante listener para detectar cambios en el estado de autenticación 

            data: { subscription }, // extraemos la suscripción del listener de auth}

        } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {

            setSession(currentSession);// Guarda la nueva sesión actual en el estado


            if (currentSession?.user) { //Verificamos si la sesión actual tiene el usuario autenticado

                await loadPerfil(currentSession.user.id); //cargamos el perfil del usuario autenticado

            } else {

                setPerfil(null); //Si no hay usuario, limpia el perfíl
            }

            setLoading(false); // Indicará que ya terminó la carga después del cambio de autenticación
        });


        return () => { //Retornamos una función de limpieza cuando el componente se desmonta

            subscription.unsubscribe(); //Cancelamos la suscripción al listener de auth para evitar fugas de memoria
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