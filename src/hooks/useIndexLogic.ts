import { useEffect } from 'react'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

// (ESTE ARCHIVO ACTÚA COMO EL GUARDIA DE SEGURIDAD EN LA PUERTA DE ENTRADA DE LA APP DECIDIENDO A QUÉ PANTALLA DEBE IR CADA USUARIO APENAS ABRE LA APLICACIÓN)

// (El gancho que controla las redirecciones automáticas iniciales)
export function useIndexLogic() {
    // (Le preguntamos al contexto de autenticación quién está conectado ahorita mismo)
    const { session, perfil, loading } = useAuth()

    // (Efecto de React que se dispara automáticamente apenas la app carga)
    useEffect(() => {
        // (Esperamos pacientemente a que termine de cargar la info de sesión antes de tomar decisiones apresuradas)
        if (loading) return

        // (Si no hay nadie conectado o si el perfil está en blanco los pateamos directo a iniciar sesión)
        if (!session || !perfil) {
            router.replace('/login')
            return
        }

        // (Si el usuario existe pero el administrador lo bloqueó también va para afuera)
        if (perfil.estado !== 'activo') {
            router.replace('/login')
            return
        }

        // (Si falta la cédula, el teléfono, o el usuario es genérico de red social, lo mandamos a completar el perfil)
        if (!perfil.cedula || !perfil.telefono || (perfil.usuario && perfil.usuario.startsWith('user_'))) {
            router.replace('/(auth)/completar-perfil')
            return
        }

        // (Dependiendo del gafete que tenga le abrimos la puerta de su respectivo panel de control)
        if (perfil.rol === 'admin') {
            router.replace('/(admin)')
        } else if (perfil.rol === 'operador') {
            router.replace('/(operador)')
        } else {
            router.replace('/(cliente)')
        }
    }, [session, perfil, loading])

    // (Este gancho no necesita devolver variables porque todo lo hace en segundo plano)
    return {}
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas el useEffect la aplicación se quedará congelada en una pantalla en blanco eternamente porque nadie le dirá a dónde ir cuando se abra)
*/