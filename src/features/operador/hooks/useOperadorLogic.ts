import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

// (ESTE ARCHIVO ES EL PANEL DE CONTROL DEL OPERADOR QUE LE DA LOS BOTONES PARA IR A GENERAR COBROS REVISAR SUS CUPONES Y EMITIR FACTURAS SIN COMPLICARSE CON RUTAS)

// (El gancho que le da funcionalidad a la pantalla principal del operador)
export function useOperadorLogic() {
    // (Traemos el perfil del operador logueado y la función para cerrar su sesión)
    const { perfil, signOut } = useAuth()

    // (Función del botón de cerrar sesión que termina la sesión y lo manda a login)
    async function handleLogout() {
        // (Destruimos el token de sesión en Supabase)
        await signOut()
        // (Lo sacamos a la pantalla de login sin pasaje de vuelta para que no pueda retroceder)
        router.replace('/login')
    }

    // (Botón de atajo que lleva al operador al formulario de cobro para crear el QR)
    function irAgregarPago() {
        router.push('/(operador)/agregar-pago')
    }

    // (Botón de atajo que lleva al historial de cupones del operador)
    function irHistorialCupones() {
        router.push('/(operador)/cupones')
    }

    // (Botón de atajo para ir a la pantalla de generación de facturas)
    function irGenerarFactura() {
        router.push('/(operador)/factura')
    }

    // (Exportamos el perfil y los botones de navegación para que la pantalla los dibuje)
    return {
        perfil,
        handleLogout,
        irAgregarPago,
        irHistorialCupones,
        irGenerarFactura,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas handleLogout el operador quedará atrapado eternamente en su panel y no podrá salir a menos que reinstale la app)
(si quitas irAgregarPago el botón principal del panel que es el de generar un QR de cobro dejará de funcionar impidiendo que se venda gasolina)
(si quitas irHistorialCupones el botón de cupones será un adorno sin funcionalidad)
(si quitas irGenerarFactura el botón de facturas no llevará a ningún lado y no podrán emitir comprobantes)
*/