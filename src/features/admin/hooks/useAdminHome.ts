import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'

import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { AdminService } from '@/services/AdminService'

// (ESTE ARCHIVO ES EL CEREBRO DE LA PANTALLA PRINCIPAL DEL ADMINISTRADOR DONDE SE CARGAN LOS CONTADORES GIGANTES DE CUÁNTOS USUARIOS Y MOVIMIENTOS HAY EN TOTAL)

// (El gancho que controla el panel de bienvenida del administrador)
export function useAdminHome() {
    // (Nos traemos el perfil del administrador logueado para poder decirle hola por su nombre)
    // (También nos traemos la función signOut para poder cerrar sesión cuando se aburra)
    const { perfil, signOut } = useAuth()

    // (Todos estos estados guardan los numeritos redondos que ves en las tarjetas de resumen)
    // (Cuántos usuarios hay en total mezclados)
    const [totalUsuarios, setTotalUsuarios] = useState(0)
    // (Cuántos de esos usuarios son clientes normales)
    const [totalClientes, setTotalClientes] = useState(0)
    // (Cuántos son operadores de gasolinera)
    const [totalOperadores, setTotalOperadores] = useState(0)
    // (Cuántos son los jefes supremos o administradores)
    const [totalAdmins, setTotalAdmins] = useState(0)
    // (Cuántas facturas de gasolina se han pagado en la historia)
    const [totalPagos, setTotalPagos] = useState(0)
    // (Cuántas veces la gente le metió dinero a su billetera virtual)
    const [totalRecargas, setTotalRecargas] = useState(0)
    // (Cuántos cupones de descuento existen en la base de datos)
    const [totalCupones, setTotalCupones] = useState(0)
    
    // (Interruptor de carga para que la pantalla ponga esqueletos o una ruedita mientras bajamos esta data inmensa)
    const [loadingData, setLoadingData] = useState(true)

    // (La función que va hasta el servidor pregunta por los totales y los acomoda en su sitio)
    const cargarResumen = useCallback(async () => {
        // (Intentamos hacer la petición de manera segura)
        try {
            // (Avisamos que empezamos a contar)
            setLoadingData(true)

            // (Le mandamos el trabajo pesado a nuestro servicio de Supabase para que nos traiga todo de un jalón)
            const data = await AdminService.obtenerTotalesDashboard()

            // (Si Supabase nos dice que algo salió mal paramos todo)
            if (data.error) {
                console.log(data.error.message)
                CustomAlert.alert('Error', 'No se pudo cargar el resumen')
                return
            }

            // (Asignamos todos los conteos exactos que devuelve el servicio)
            setTotalUsuarios(data.totalUsuarios)
            setTotalClientes(data.totalClientes)
            setTotalOperadores(data.totalOperadores)
            setTotalAdmins(data.totalAdmins)
            setTotalPagos(data.totalPagos)
            setTotalRecargas(data.totalRecargas)
            setTotalCupones(data.totalCupones)

        } catch (error) {
            // (Si pasa algo sumamente extraño que la red no entiende)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar el panel admin')
        } finally {
            // (Pase lo que pase al final apagamos el modo de carga)
            setLoadingData(false)
        }
    }, [])

    // (Efecto de React que asegura que las tarjetas empiecen a contar apenitas pisas la pantalla principal)
    useEffect(() => {
        cargarResumen()
    }, [cargarResumen])

    // (Función dedicada al botón de salir que mata la sesión y te manda a volar a la pantalla de login)
    async function handleLogout() {
        // (Borramos el token y cerramos sesión en la nube)
        await signOut()
        // (Destruimos el historial de navegación para que no puedas volver usando la flecha de atrás)
        router.replace('/login')
    }

    // (Empaquetamos números funciones y rutas para que la pantalla las use en sus botones)
    return {
        // Datos
        perfil,
        totalUsuarios,
        totalClientes,
        totalOperadores,
        totalAdmins,
        totalPagos,
        totalRecargas,
        totalCupones,
        loadingData,
        
        // Acciones principales
        cargarResumen,
        handleLogout,
        
        // Navegación (ahora con any temporal para que TS no se queje mientras preparamos las pantallas)
        irClientes: () => router.push('/(admin)/clientes' as any),
        irOperadores: () => router.push('/(admin)/operadores' as any),
        irAdministradores: () => router.push('/(admin)/administradores' as any),
        irCupones: () => router.push('/(admin)/cupones' as any),
        irAnaliticas: () => router.push('/(admin)/analiticas' as any),
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarResumen todas las tarjetas de estadísticas mostrarán un cerapio absoluto siempre)
(si quitas handleLogout el administrador quedará atrapado en su panel y no podrá cerrar sesión a menos que borre la app)
(si quitas las funciones irClientes irOperadores o cualquier otra de navegación los botones de las tarjetas estarán de adorno y no te llevarán a ningún lado)
*/