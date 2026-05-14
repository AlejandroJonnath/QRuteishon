import 'react-native-url-polyfill/auto'; //Importamos esto para que react native pueda manejar las url's correctamente, es algo necesario para que SupaBase funcione bien en entornos móviles
import AsyncStorage from '@react-native-async-storage/async-storage'; //Permitirá guardar datos de forma persistente en el dispositivo
import { AppState, Platform } from 'react-native'; // Sirve para detectar si la app está activa o en segundo plano, y el Platform sirve para saber si la app se está ejecutando en web, Android o IOS
import { createClient, processLock } from '@supabase/supabase-js'; //Creamos la conexión con Supabase y el processLock para manejar los procesos de auth en React Native


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL; //Obtenemos la url del proyecto de SupaBase desde el ENV
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; //lo mismo pero aquí será la clave pública anon


if (!supabaseUrl) { //Verificamos si la URL de SupaBase no existe o no fue cargada correctamente

    throw new Error('Falta EXPO_PUBLIC_SUPABASE_URL en el archivo .env'); // Detiene la app y muestra el error en texto
}

if (!supabaseAnonKey) { // Lo mismo de arriba pero con la clave pública de anon

    throw new Error('Falta EXPO_PUBLIC_SUPABASE_ANON_KEY en el archivo .env');
}


// Verificamos si estamos en un entorno donde no hay "window" (como el Server-Side Rendering de Expo)
const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

// Un storage de mentira para que Supabase no intente leer de AsyncStorage en el servidor (que rompe la app)
const dummyStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { //Crearemos y exportaremos el cliente de SupaBase para usarlo en toda la app

    auth: { //configuramos el módulo de auth de SupaBase

        storage: isSSR ? dummyStorage : AsyncStorage as any, //Usamos el AsyncStorage, excepto en SSR donde usamos el dummy

        autoRefreshToken: true,//Haremos que SupaBase renueve automáticamente el token de iniciar sesión

        persistSession: true, //Mantiene la sesión guardada aunque se cierre y vuelve abrir la app

        detectSessionInUrl: false, //Desactiva la detección de la sesión desde la URL

        lock: processLock, //Usamos el processLock para evitar conflictos en procesos internos de auth
    },
});

if (Platform.OS !== 'web') { //Verificamos si la app no se está ejecutando en un entorno web

    AppState.addEventListener('change', (state) => { //Hacemos un listener de estado de la app, por ejemplo activa o en segundo plano

        if (state === 'active') { // Si la app vuelve a estar activa.

            supabase.auth.startAutoRefresh();// Inicia una renovación automática del tokten de auth

        } else {// Si la app pasa a segundo plano o queda inactiva.

            supabase.auth.stopAutoRefresh(); //Detendrá la renovación automática del token para ahorrar recursos
        }
    });
}

/*
Cuando ejecutas la app con Expo en la terminal, Expo Router intenta "pre-renderizar" la aplicación o evaluar el código base en un entorno de Node.js en la computadora (no en un navegador web ni en un celular).
En ese entorno de servidor no existe el objeto window. Sin embargo, AsyncStorage asume que sí existe al momento en que Supabase intentaba leer la sesión guardada (__loadSession), la librería de AsyncStorage trataba de acceder a window.localStorage y provocaba que toda la aplicación colapsara con el error ReferenceError: window is not defined.
¿Cómo lo solucioné? Se tiene que modificar el archivo lib/supabase.ts.
Tuve que añadir una verificación para detectar si la aplicación se está inicializando en este entorno de servidor (typeof window === 'undefined').
Si es así, le pasamos a Supabase un dummy storage (un almacenamiento simulado vacío) en vez de AsyncStorage.
De esta forma, Supabase no intenta buscar el window y la compilación pasa limpiamente. En celulares (iOS/Android) seguirá funcionando perfectamente con AsyncStorage.
*/