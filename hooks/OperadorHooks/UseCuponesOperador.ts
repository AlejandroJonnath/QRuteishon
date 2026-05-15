import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'

import { useAuth } from '../../context/AuthContext'
import { CuponesService } from '../../services/CuponesService'
import { obtenerRangoMesActual } from '../../utils/dateHelpers'

// (ESTE ARCHIVO MANEJA LA PANTALLA DE CUPONES DEL OPERADOR DONDE PUEDE VER LOS DESCUENTOS QUE TIENE Y GENERAR SU CUPÓN MENSUAL DE BENEFICIO)

// (Molde de cómo luce un cupón del operador en la base de datos)
export type CuponOperador = {
    // (Identificador único del cupón)
    id: string
    // (El texto del código que el cliente usa para canjear)
    codigo: string
    // (A qué operador le pertenece)
    propietario_id: string
    // (El rol del dueño)
    propietario_rol: string
    // (Si es descuento en dólares fijos o en porcentaje)
    tipo_descuento: 'monto' | 'porcentaje'
    // (El valor numérico del descuento)
    valor_descuento: number
    // (Si se destruye después de usarlo una vez)
    uso_unico: boolean
    // (El estado actual del cupón)
    estado: 'disponible' | 'usado' | 'vencido'
    // (En qué pago fue canjeado si es que se usó)
    usado_en_pago_id: string | null
    // (Cuándo deja de funcionar este cupón)
    expira_en: string | null
    // (Cuándo fue creado)
    created_at: string
}

// (El gancho que alimenta la pantalla de cupones del operador)
export function useCuponesOperador() {
    // (Sacamos la sesión para identificar a qué operador le pertenecen los cupones)
    const { session } = useAuth()

    // (La lista completa de cupones del operador)
    const [cupones, setCupones] = useState<CuponOperador[]>([])
    
    // (Spinner para la carga inicial de la lista de cupones)
    const [loadingData, setLoadingData] = useState(true)
    // (Spinner específico para el botón de crear cupón mensual)
    const [loadingCrear, setLoadingCrear] = useState(false)

    // (La ID del operador logueado)
    const operadorId = session?.user?.id

    // (Función que baja del servidor todos los cupones del operador)
    const cargarCupones = useCallback(async () => {
        // (Si no sabemos quién es nos detenemos)
        if (!operadorId) return

        // (Intentamos la descarga)
        try {
            // (Prendemos el spinner de carga)
            setLoadingData(true)

            // (Le pedimos al servicio los cupones disponibles de este operador)
            const { data, error } = await CuponesService.obtenerCuponesDisponibles(operadorId, 'operador')

            // (Si la base de datos nos dice que no avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones')
                return
            }

            // (Guardamos la lista de cupones en nuestro estado)
            setCupones((data || []) as CuponOperador[])
        } catch (error) {
            // (Atrapamos errores inesperados)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones')
        } finally {
            // (Apagamos el spinner de carga)
            setLoadingData(false)
        }
    }, [operadorId])

    // (Cargamos los cupones apenas el operador entra a la pantalla)
    useEffect(() => {
        cargarCupones()
    }, [cargarCupones])

    // (Esta función genera el cupón mensual de beneficio que se le asigna automáticamente al operador)
    async function crearCuponMensual() {
        // (Verificamos que haya sesión)
        if (!operadorId) {
            CustomAlert.alert('Error', 'No se pudo obtener el operador actual')
            return
        }

        // (Intentamos crear el cupón)
        try {
            // (Prendemos el spinner del botón de crear)
            setLoadingCrear(true)

            // (Usamos nuestro helper de fechas para calcular el inicio y fin del mes actual sin equivocarnos)
            const { inicioMes, inicioSiguienteMes, finMes } = obtenerRangoMesActual()

            // (Le preguntamos al servicio si ya creó un cupón este mes para no hacer dos)
            const { data: cuponExistente, error: existeError } = await CuponesService.verificarCuponMesActual(
                operadorId, 
                inicioMes, 
                inicioSiguienteMes
            )

            // (Si falla la verificación paramos)
            if (existeError) {
                console.log(existeError.message)
                CustomAlert.alert('Error', 'No se pudo validar el cupón mensual')
                return
            }

            // (Si ya tiene uno este mes le mostramos cuál es para que no intente crear otro)
            if (cuponExistente) {
                CustomAlert.alert(
                    'Cupón ya creado',
                    `Ya tienes un cupón asignado este mes: ${cuponExistente.codigo}`
                )
                return
            }

            // (Preparamos todos los ingredientes para el código del cupón)
            const ahora = new Date()
            const anio = ahora.getFullYear()
            // (El mes lo ponemos con dos dígitos siempre por ejemplo 05 en lugar de 5)
            const mes = String(ahora.getMonth() + 1).padStart(2, '0')
            // (Un sufijo aleatorio de 4 caracteres para que el código sea único)
            const random = Math.random().toString(36).substring(2, 6).toUpperCase()

            // (Armamos el código con el prefijo oficial de la empresa el año el mes y el sufijo aleatorio)
            const codigo = `QRUTA-OP-${anio}${mes}-${random}`

            // (Preparamos el paquete de datos del cupón para la base de datos)
            const datosCupon = {
                codigo,
                propietario_id: operadorId,
                propietario_rol: 'operador',
                // (El beneficio mensual del operador es un 5 porciento de descuento)
                tipo_descuento: 'porcentaje',
                valor_descuento: 5,
                // (Se quema al primer uso)
                uso_unico: true,
                estado: 'disponible',
                usado_en_pago_id: null,
                // (Expira el último segundo del mes actual)
                expira_en: finMes.toISOString(),
            }

            // (Le pedimos al servicio que lo inserte en la tabla de cupones)
            const { error } = await CuponesService.crearCupon(datosCupon)

            // (Si falla la inserción avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo crear el cupón mensual')
                return
            }

            // (Celebramos mostrando el código del cupón recién nacido)
            CustomAlert.alert('Cupón creado', `Se creó tu cupón mensual: ${codigo}`)

            // (Recargamos la lista para que aparezca el nuevo cupón)
            await cargarCupones()
        } catch (error) {
            // (Atrapamos errores inesperados)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al crear el cupón')
        } finally {
            // (Apagamos el spinner del botón crear)
            setLoadingCrear(false)
        }
    }

    // (Exportamos la lista los spinners y las funciones para que la pantalla los use)
    return {
        cupones,
        loadingData,
        loadingCrear,
        cargarCupones,
        crearCuponMensual,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarCupones la lista de cupones aparecerá en blanco siempre aunque el operador haya generado varios en el pasado)
(si quitas crearCuponMensual el botón de generar beneficio mensual no hará nada y el operador nunca podrá reclamar su descuento del mes)
*/