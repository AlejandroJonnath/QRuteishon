import { useCallback, useEffect, useMemo, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'

import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { BilleteraService } from '../../services/BilleteraService'
import { CuponesService } from '../../services/CuponesService'
import { obtenerMontoNumerico } from '../../utils/formatters'

// (ESTE ARCHIVO CONTROLA TODO EL FLUJO DE RECARGAR SALDO A LA BILLETERA VIRTUAL INCLUYENDO LA SELECCIÓN DE TARJETA LA APLICACIÓN DE CUPONES Y EL REGISTRO EN LA BASE DE DATOS)

// (Los dos tipos de tarjeta que se pueden usar para recargar)
export type MetodoRecarga = 'credito' | 'debito'

// (Cómo se ve una tarjeta bancaria vinculada al usuario en la base de datos)
export type MetodoPago = {
    // (Identificador único de la tarjeta)
    id: string
    // (A qué usuario pertenece)
    usuario_id: string
    // (Si es crédito o débito)
    tipo: MetodoRecarga
    // (La marca de la tarjeta)
    marca: string | null
    // (Los cuatro dígitos finales de la tarjeta para identificarla)
    ultimos_4: string
    // (Nombre del titular)
    titular: string | null
    // (Si está activa y disponible para cobrar)
    estado: string
}

// (Cómo se ve un cupón de descuento que tiene listo el cliente para aplicar)
export type CuponRecarga = {
    // (Identificador del cupón)
    id: string
    // (El código que se escribe para aplicarlo)
    codigo: string
    // (A quién le fue asignado)
    propietario_id: string
    // (El rol del dueño)
    propietario_rol: string
    // (Si es un descuento en dólares fijos o en porcentaje)
    tipo_descuento: 'monto' | 'porcentaje'
    // (Cuánto vale el descuento numéricamente)
    valor_descuento: number
    // (Si se quema después del primer uso)
    uso_unico: boolean
    // (Si todavía está disponible o ya se usó)
    estado: string
    // (A qué transacción se le aplicó)
    usado_en_pago_id: string | null
    // (La fecha límite para usarlo)
    expira_en: string | null
}

// (El tope máximo que alguien puede meter de un solo golpe a su billetera virtual)
export const MONTO_MAXIMO_RECARGA = 200

// (El gancho gigante que junta toda la lógica de la pantalla de recargar)
export function useRecarga() {
    // (Necesitamos la sesión para saber a quién le pertenece la billetera)
    const { session } = useAuth()

    // (Lo que el usuario va escribiendo en el cuadro de monto)
    const [monto, setMonto] = useState('')
    // (Spinner del botón de recargar para evitar múltiples cobros)
    const [loading, setLoading] = useState(false)
    // (Spinner de la carga inicial de tarjetas y cupones)
    const [loadingData, setLoadingData] = useState(true)

    // (Lista de tarjetas vinculadas del usuario para el selector)
    const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
    // (La tarjeta que el usuario eligió para pagar la recarga)
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<MetodoPago | null>(null)

    // (Lista de cupones disponibles del usuario)
    const [cupones, setCupones] = useState<CuponRecarga[]>([])
    // (El cupón que el usuario eligió aplicar si eligió uno)
    const [cuponSeleccionado, setCuponSeleccionado] = useState<CuponRecarga | null>(null)

    // (La ID del usuario para no buscarla en cada función)
    const usuarioId = session?.user?.id

    // (Calculamos el monto numérico real que escribió el usuario solo cuando el texto cambia)
    // (useMemo evita recalcular esto en cada render aunque no haya cambiado nada)
    const montoNumerico = useMemo(() => {
        const valor = obtenerMontoNumerico(monto)
        // (Si el usuario escribió letras o algo raro devolvemos 0)
        return Number.isNaN(valor) ? 0 : valor
    }, [monto])

    // (Calculamos el descuento que aplica el cupón solo cuando cambia el cupón o el monto)
    const descuentoCupon = useMemo(() => {
        // (Si no hay cupón o el monto es cero no hay descuento)
        if (!cuponSeleccionado || montoNumerico <= 0) return 0

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0)

        // (Si el cupón es de tipo porcentaje calculamos la proporción)
        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((montoNumerico * valorDescuento) / 100).toFixed(2))
        }

        // (Si el cupón es de monto fijo pero vale más de lo que se va a recargar solo descontamos lo que se puede)
        return Math.min(valorDescuento, montoNumerico)
    }, [cuponSeleccionado, montoNumerico])

    // (El total real que se le va a cobrar al usuario después de aplicar el descuento)
    const totalSimuladoAPagar = useMemo(() => {
        // (Math.max asegura que el total nunca sea negativo aunque el cupón sea más grande que la recarga)
        return Number(Math.max(montoNumerico - descuentoCupon, 0).toFixed(2))
    }, [montoNumerico, descuentoCupon])

    // (Función que descarga del servidor las tarjetas y los cupones del usuario)
    const cargarDatosRecarga = useCallback(async () => {
        // (Si no sabemos quién es no hacemos nada)
        if (!usuarioId) return

        // (Intentamos descargar ambas cosas)
        try {
            // (Prendemos el spinner de carga inicial)
            setLoadingData(true)

            // (Pedimos las tarjetas bancarias activas del usuario)
            const { data: metodosData, error: metodosError } = await BilleteraService.obtenerMetodosPago(usuarioId)

            // (Si falla la descarga avisamos)
            if (metodosError) {
                console.log(metodosError.message)
                CustomAlert.alert('Error', 'No se pudieron cargar tus métodos de pago')
                return
            }

            // (Guardamos las tarjetas en el estado)
            setMetodosPago(metodosData || [])

            // (Como cortesía le seleccionamos la primera tarjeta automáticamente para que no tenga que elegir)
            if (metodosData && metodosData.length > 0 && !metodoPagoSeleccionado) {
                setMetodoPagoSeleccionado(metodosData[0])
            }

            // (Ahora pedimos sus cupones disponibles)
            const { data: cuponesData, error: cuponesError } = await CuponesService.obtenerCuponesDisponibles(usuarioId, 'cliente')

            // (Si falla la carga de cupones avisamos)
            if (cuponesError) {
                console.log(cuponesError.message)
                CustomAlert.alert('Error', 'No se pudieron cargar tus cupones')
                return
            }

            // (Filtramos los cupones que ya se les pasó su fecha de expiración para no mostrar basura)
            const cuponesDisponibles = (cuponesData || []).filter((cupon) => {
                // (Si no tiene fecha de expiración siempre está disponible)
                if (!cupon.expira_en) return true
                // (Si tiene fecha revisamos que no haya vencido)
                return new Date(cupon.expira_en) >= new Date()
            })

            // (Guardamos solo los cupones que aún sirven)
            setCupones(cuponesDisponibles as CuponRecarga[])
        } catch (error) {
            // (Si algo explota de manera extraña lo atrapamos)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar datos de recarga')
        } finally {
            // (Apagamos el spinner de carga inicial)
            setLoadingData(false)
        }
    }, [usuarioId, metodoPagoSeleccionado])

    // (Efecto que carga los datos apenas el usuario entra a la pantalla de recargar)
    useEffect(() => {
        cargarDatosRecarga()
    }, [cargarDatosRecarga])

    // (La función principal que procesa la recarga real y mete la plata a la billetera)
    async function handleRecargar() {
        // (Necesitamos la ID del usuario para la transacción)
        const usuarioId = session?.user?.id
        // (Convertimos el texto del monto a número real)
        const montoFinal = obtenerMontoNumerico(monto)

        // (Verificamos que haya sesión activa)
        if (!usuarioId) {
            CustomAlert.alert('Error', 'No se pudo obtener el usuario actual')
            return
        }

        // (Verificamos que haya escrito un monto válido y mayor a cero)
        if (!monto.trim() || Number.isNaN(montoFinal) || montoFinal <= 0) {
            CustomAlert.alert('Monto inválido', 'Ingresa un monto válido mayor a $0.00')
            return
        }

        // (Verificamos que no intente meter más del límite establecido)
        if (montoFinal > MONTO_MAXIMO_RECARGA) {
            CustomAlert.alert('Monto excedido', `El monto máximo de recarga es $${MONTO_MAXIMO_RECARGA.toFixed(2)}`)
            return
        }

        // (Verificamos que haya elegido con qué tarjeta pagar)
        if (!metodoPagoSeleccionado) {
            CustomAlert.alert('Método de pago requerido', 'Debes seleccionar una tarjeta activa para recargar')
            return
        }

        // (Si todo está bien iniciamos el proceso de recarga)
        try {
            // (Prendemos el spinner del botón recargar)
            setLoading(true)

            // (Buscamos la billetera del usuario para ver su saldo actual)
            const { data: billetera, error: billeteraError } = await BilleteraService.obtenerBilletera(usuarioId)

            // (Si no tiene billetera o falló la búsqueda paramos)
            if (billeteraError || !billetera) {
                CustomAlert.alert('Billetera no encontrada', 'Tu usuario todavía no tiene una billetera Q-Ruta')
                return
            }

            // (Si la billetera existe pero está bloqueada tampoco podemos meterle plata)
            if (billetera.estado !== 'activa') {
                CustomAlert.alert('Billetera inactiva', 'Tu billetera no está activa para recibir recargas')
                return
            }

            // (Calculamos el nuevo saldo sumando lo que quiere recargar)
            const saldoActual = Number(billetera.saldo || 0)
            const nuevoSaldo = Number((saldoActual + montoFinal).toFixed(2))

            // (Preparamos el objeto de la recarga para guardarlo en la tabla de recargas)
            const datosRecarga = {
                usuario_id: usuarioId,
                billetera_id: billetera.id,
                monto: montoFinal,
                metodo: metodoPagoSeleccionado.tipo,
                estado: 'aprobada',
            }

            // (Preparamos la descripción humana del movimiento para el historial)
            const descripcionRecarga = cuponSeleccionado
                ? `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}. Cupón aplicado: ${cuponSeleccionado.codigo}`
                : `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}`

            // (Preparamos el movimiento de historial para que el usuario vea en qué gastó)
            const datosMovimiento = {
                usuario_id: usuarioId,
                tipo: 'recarga',
                descripcion: descripcionRecarga,
                monto: montoFinal,
                estado: 'completado',
                referencia_id: '',
            }

            // (Si usó cupón preparamos también un movimiento extra explicando el descuento)
            const datosMovimientoCupon = cuponSeleccionado ? {
                usuario_id: usuarioId,
                tipo: 'cupon',
                descripcion: `Cupón canjeado: ${cuponSeleccionado.codigo}. Descuento simulado: $${descuentoCupon.toFixed(2)}`,
                monto: 0,
                estado: 'completado',
                referencia_id: cuponSeleccionado.id,
            } : null

            // (Le pasamos todo al servicio para que procese la transacción completa de una sola vez)
            const result = await BilleteraService.procesarRecarga(
                usuarioId,
                billetera.id,
                nuevoSaldo,
                datosRecarga,
                datosMovimiento,
                cuponSeleccionado,
                datosMovimientoCupon
            )

            // (Si algún paso de la transacción falló avisamos con el paso específico)
            if (result.error) {
                CustomAlert.alert('Error', `Ocurrió un problema en el paso: ${result.paso}`)
                return
            }

            // (Celebramos el éxito mostrando cuánto se metió y si hubo cupón)
            CustomAlert.alert(
                'Recarga exitosa',
                cuponSeleccionado
                    ? `Se recargaron $${montoFinal.toFixed(2)}. Descuento simulado aplicado: $${descuentoCupon.toFixed(2)}`
                    : `Se recargaron $${montoFinal.toFixed(2)} a tu tarjeta Q-Ruta`,
                [{ text: 'Aceptar', onPress: () => router.replace('/cliente') }]
            )
        } catch (error) {
            // (Si algo explota de forma inesperada lo atrapamos)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al recargar saldo')
        } finally {
            // (Apagamos el spinner del botón)
            setLoading(false)
        }
    }

    // (Entregamos todo a la pantalla para que los cuadros la ruedita y los botones funcionen)
    return {
        monto,
        setMonto,
        loading,
        loadingData,
        metodosPago,
        metodoPagoSeleccionado,
        setMetodoPagoSeleccionado,
        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,
        descuentoCupon,
        totalSimuladoAPagar,
        cargarDatosRecarga,
        handleRecargar,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarDatosRecarga la pantalla no sabrá qué tarjetas tiene el usuario y el selector aparecerá vacío)
(si quitas handleRecargar el botón azul de recargar no hará absolutamente nada y el saldo no cambiará nunca)
(si quitas descuentoCupon o totalSimuladoAPagar los precios mostrados al usuario serán incorrectos y verá el monto sin descuento aunque tenga cupón activo)
*/