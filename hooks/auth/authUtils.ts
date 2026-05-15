// Importamos CustomAlert para mostrar mensajes en pantalla cuando algo falla
import { CustomAlert } from '../../utils/AlertManager';
// Importamos router para poder mandar al usuario a otra pantalla
import { router } from 'expo-router';
// Importamos AuthService para hablar con la base de datos de usuarios
import { AuthService } from '../../services/AuthService';
// Importamos el tipo Rol para saber si es admin, operador o cliente
import type { Rol } from '../../services/AuthService';

// Sección
// Este archivo guarda utilidades sueltas de autenticación que pueden ser usadas por cualquier parte de la app
// (así no repetimos el mismo código en varios lugares)

// Funciones
// redirectByRole: Sirve para revisar el perfil del usuario recién logueado y mandarlo en taxi a su pantalla correcta dependiendo de si es jefe, trabajador o cliente

// (Esta función es asíncrona porque tiene que ir a la base de datos a preguntar quién es este usuario)
export async function redirectByRole(userId: string) {
    // (Le pedimos a Supabase que nos traiga todo el perfil de la persona usando su ID)
    const { data: perfil, error } = await AuthService.obtenerPerfil(userId);

    // (Si hubo un error técnico o la persona no tiene perfil en la tabla, lo detenemos aquí)
    if (error || !perfil) {
        // (Le mostramos un mensaje de error global para que sepa qué pasó)
        CustomAlert.alert(
            'Perfil no encontrado',
            'El usuario existe en Auth pero todavía no se encontró su perfil (intenta iniciar sesión nuevamente)'
        );
        // (Cortamos la ejecución para que no intente seguir)
        return;
    }

    // (Verificamos si su cuenta fue baneada o desactivada por un administrador)
    if (perfil.estado !== 'activo') {
        // (Le mostramos el mensaje de que está desactivado)
        CustomAlert.alert(
            'Cuenta inactiva',
            'Tu cuenta está desactivada (contacta al administrador)'
        );
        // (Como está bloqueado, le cerramos la sesión inmediatamente para que no haga trampa)
        await AuthService.cerrarSesion();
        // (Cortamos la ejecución)
        return;
    }

    // (Guardamos qué rol tiene la persona para no escribir perfil.rol a cada rato)
    const rol = perfil.rol as Rol;

    // (Si es el dueño o jefe, lo mandamos al panel de administrador)
    if (rol === 'admin') {
        router.replace('/administrador');
    // (Si es el que despacha la gasolina, lo mandamos al panel de operador)
    } else if (rol === 'operador') {
        router.replace('/operador');
    // (Si es cualquier otra persona, asumimos que es un cliente normal)
    } else {
        router.replace('/cliente');
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas redirectByRole los usuarios podrán iniciar sesión pero se quedarán atrapados en la pantalla de login para siempre porque nadie los enviará a su panel correspondiente)
*/
