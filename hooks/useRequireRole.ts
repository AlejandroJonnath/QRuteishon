import { useEffect } from 'react'
import { router } from 'expo-router'
import { useAuth } from '../context/AuthContext'

// (ESTE ARCHIVO ES EL CADENERO DEL ANTRO SE ASEGURA DE QUE SOLO ENTRES A LA PANTALLA SI TIENES EL PERMISO CORRECTO SI NO TE SACA)

// (Definimos los únicos tres tipos de gafetes que existen en nuestra aplicación)
type Rol = 'cliente' | 'operador' | 'admin'

// (Este gancho recibe como parámetro el rol que obligatoriamente debe tener el usuario para entrar)
export function useRequireRole(requiredRole: Rol) {
    // (Le preguntamos al sistema quién está intentando entrar y si todavía estamos descargando su info)
    const { session, perfil, loading } = useAuth()

    // (Efecto que salta inmediatamente cuando la pantalla se intenta dibujar)
    useEffect(() => {
        // (No hacemos absolutamente nada hasta que la base de datos nos confirme la info completa)
        if (loading) return

        // (Si descubrimos que es un fantasma sin sesión o sin perfil lo pateamos directo al login)
        if (!session || !perfil) {
            router.replace('/login')
            return
        }

        // (Si tiene cuenta pero el administrador lo castigó bloqueándolo también va para afuera)
        if (perfil.estado !== 'activo') {
            router.replace('/login')
            return
        }

        // (Si es un cliente intentando entrar al panel de admin lo mandamos a la pantalla de inicio para que se redirija a donde sí debe estar)
        if (perfil.rol !== requiredRole) {
            router.replace('/')
        }
    }, [session, perfil, loading, requiredRole])

    // (Devolvemos la información limpiecita para que la pantalla la use con seguridad)
    return { session, perfil, loading }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas useRequireRole absolutamente cualquiera podría escribir en el navegador app/administrador y entrar a la pantalla de los jefes sin permiso)
*/