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


export const supabase = createClient(supabaseUrl, supabaseAnonKey, { //Crearemos y exportaremos el cliente de SupaBase para usarlo en toda la app

    auth: { //configuramos el módulo de auth de SupaBase

        storage: AsyncStorage as any, //Usamos el AsyncStorage para guardar la sesión en el dispositivo

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