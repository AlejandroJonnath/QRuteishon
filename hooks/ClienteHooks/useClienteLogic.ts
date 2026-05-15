import { router, type Href } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'

import { BilleteraService } from '../../services/BilleteraService'
import { CuponesService } from '../../services/CuponesService'

// (ESTE ARCHIVO ES EL MOTOR PRINCIPAL DEL PANEL DEL CLIENTE DONDE SE CARGA SU BILLETERA SUS MOVIMIENTOS RECIENTES Y LOS CUPONES QUE TIENE DISPONIBLES)

// (Le indicamos a la compu exactamente cómo se ve la billetera en la base de datos para no confundirnos)
type Billetera = {
    // (Identificador único de esta cuenta virtual)
    id: string
    // (A quién le pertenece este dinero)
    usuario_id: string
    // (El código raro que parece tarjeta de crédito pero es virtual)
    numero_tarjeta: string
    // (La cantidad de dólares que tiene disponibles)
    saldo: number
    // (Si la cuenta está activa o congelada)
    estado: string
    // (Cuándo se creó esta billetera)
    created_at: string
}

// (Le enseñamos a TypeScript cómo luce un pago o recarga en el historial)
type Movimiento = {
    // (Identificador de la transacción)
    id: string
    // (Quién hizo el movimiento)
    usuario_id: string
    // (Si fue recarga o pago de gasolina)
    tipo: string
    // (Pequeño texto explicando el cobro o la recarga)
    descripcion: string | null
    // (Cuántos dólares se movieron)
    monto: number
    // (Si pasó se canceló o falló)
    estado: string
    // (A qué orden pertenece esto si es que existe)
    referencia_id: string | null
    // (La fecha exacta del movimiento)
    created_at: string
}

// (Este es el molde para los descuentos que el cliente podrá aplicar)
type Cupon = {
    // (Identificador del cupón)
    id: string
    // (El texto en mayúsculas que se usa para canjearlo)
    codigo: string
    // (A quién le pertenece este cupón específico)
    propietario_id: string
    // (Qué rol tiene el dueño en este caso siempre cliente)
    propietario_rol: string
    // (Si le regalamos dólares directos o un porcentaje)
    tipo_descuento: string
    // (Cuánto vale numéricamente este descuento)
    valor_descuento: number
    // (Si se quema después de usarlo la primera vez)
    uso_unico: boolean
    // (Si está listo para usarse o si ya expiró)
    estado: string
    // (A qué orden exacta se le aplicó si es que ya se usó)
    usado_en_pago_id: string | null
    // (Cuándo deja de servir)
    expira_en: string | null
    // (La fecha de nacimiento del cupón)
    created_at: string
}

// (El gran gancho que junta todos estos datos para que la pantalla del cliente se vea bonita)
export function useClienteLogic() {
    // (Sacamos la info básica de la sesión actual para saber con quién estamos tratando)
    const { session, perfil, signOut } = useAuth()

    // (Aquí guardaremos el estado de su cuenta bancaria virtual)
    const [billetera, setBilletera] = useState<Billetera | null>(null)
    // (Aquí meteremos la lista de sus transacciones recientes)
    const [movimientos, setMovimientos] = useState<Movimiento[]>([])
    // (Y aquí los descuentos que tiene guardados para después)
    const [cupones, setCupones] = useState<Cupon[]>([])
    // (Interruptor general para mostrar pantallas de carga mientras bajamos los datos)
    const [loadingData, setLoadingData] = useState(true)

    // (Atrapamos el identificador del usuario para no estar buscándolo en la sesión a cada rato)
    const usuarioId = session?.user?.id

    // (La función recolectora que va por toda la internet bajando piezas de información)
    const cargarDatosCliente = useCallback(async () => {
        // (Si por alguna razón rara no sabemos quién es nos detenemos)
        if (!usuarioId) return

        // (Intentamos hacer las tres descargas de golpe controlando cualquier error)
        try {
            // (Prendemos la pantalla de carga para que no vea la app vacía)
            setLoadingData(true)

            // (Primero vamos por la billetera para saber cuánto saldo tiene)
            const { data: billeteraData, error: billeteraError } = await BilleteraService.obtenerBilletera(usuarioId)

            // (Si falla algo aquí le avisamos)
            if (billeteraError) {
                CustomAlert.alert('Error', 'No se pudo cargar la billetera')
                console.log(billeteraError.message)
                return
            }

            // (Guardamos la billetera asegurándonos del formato)
            setBilletera(billeteraData as Billetera | null)

            // (Luego vamos por sus últimos 5 pagos para que vea en qué ha gastado)
            const { data: movimientosData, error: movimientosError } = await BilleteraService.obtenerUltimosMovimientos(usuarioId, 5)

            // (Si el historial falla reportamos el error)
            if (movimientosError) {
                CustomAlert.alert('Error', 'No se pudieron cargar los movimientos')
                console.log(movimientosError.message)
                return
            }

            // (Guardamos el historial asegurando que si no hay nada quede un arreglo en blanco)
            setMovimientos((movimientosData || []) as Movimiento[])

            // (Finalmente buscamos si tiene algún premio o descuento esperando a ser usado)
            const { data: cuponesData, error: cuponesError } = await CuponesService.obtenerCuponesDisponibles(usuarioId, 'cliente')

            // (Si falla la carga de cupones igual avisamos)
            if (cuponesError) {
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones')
                console.log(cuponesError.message)
                return
            }

            // (Guardamos los cupones en la lista)
            setCupones((cuponesData || []) as Cupon[])
        } catch (error) {
            // (Si el teléfono se queda sin batería en pleno proceso o algo así atrapamos el problema)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar el panel')
        } finally {
            // (Apagamos la pantalla de carga principal)
            setLoadingData(false)
        }
    }, [usuarioId])

    // (Le decimos a React que recolecte los datos automáticamente apenas entres al panel)
    useEffect(() => {
        cargarDatosCliente()
    }, [cargarDatosCliente])

    // (Función del botón rojo de salida que mata la sesión y te bota a la pantalla de login)
    async function handleLogout() {
        // (Rompemos el token y limpiamos el sistema)
        await signOut()
        // (Mandamos a volar al usuario hacia afuera)
        router.replace('/login')
    }

    // (Botón atajo que te manda a la pantalla de tarjeta de crédito para recargar saldo)
    function irARecargar() {
        router.push('/cliente/recargar' as Href)
    }

    // (Botón atajo que te enciende la cámara para escanear el código del gasolinero)
    function irAPagarQr() {
        router.push('/cliente/pagar-qr' as Href)
    }

    // (Empaquetamos todas las listas totales numéricas y botoncitos para que la pantalla del celular cobre vida)
    return {
        perfil,
        billetera,
        movimientos,
        cupones,
        loadingData,
        cargarDatosCliente,
        handleLogout,
        irARecargar,
        irAPagarQr,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarDatosCliente toda la pantalla inicial del cliente parecerá una cuenta nueva vacía con cero saldo y sin historial)
(si quitas irARecargar el botón flotante verde dejará de funcionar impidiendo que la gente meta dinero a la app)
(si quitas irAPagarQr el botón gigante de la cámara será un simple adorno y no se podrá escanear para pagar gasolina)
*/
