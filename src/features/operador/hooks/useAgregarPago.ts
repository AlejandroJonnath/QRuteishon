import { useCallback, useEffect, useMemo, useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'

import { useAuth } from '@/context/AuthContext'
import { PagosService } from '@/services/PagosService'
import { CuponesService } from '@/services/CuponesService'
import { AuthService } from '@/services/AuthService'
import { obtenerMontoNumerico } from '@/utils/formatters'
import { generarTokenQr } from '@/utils/generators'

// (ESTE ARCHIVO ES EL CORAZÓN DE LA PANTALLA DE COBRO DEL OPERADOR DONDE SE CONFIGURA EL MONTO EL TIPO DE GASOLINA EL MÉTODO DE PAGO Y SE GENERA EL CÓDIGO QR QUE EL CLIENTE ESCANEA)

// (Los métodos de pago que el cliente puede usar para pagar el combustible)
export type MetodoPagoCliente = 'tarjeta_qruta' | 'credito' | 'debito'
// (Los cuatro tipos de gasolina que manejamos en la app)
export type TipoGasolina = 'extra' | 'super' | 'diesel' | 'ecopais'

// (Cómo se ve un cupón de descuento en la pantalla del operador)
export type CuponOperador = {
    // (Identificador único)
    id: string
    // (El código visible del cupón)
    codigo: string
    // (A quién le fue asignado)
    propietario_id: string
    // (El rol del dueño)
    propietario_rol: string
    // (Si es descuento fijo o en porcentaje)
    tipo_descuento: 'monto' | 'porcentaje'
    // (El valor del descuento)
    valor_descuento: number
    // (Si se quema al primer uso)
    uso_unico: boolean
    // (Si está activo o ya se usó)
    estado: string
    // (Cuándo expira)
    expira_en: string | null
}

// (Cómo luce el QR una vez que se generó para mostrarlo en pantalla)
export type PagoGenerado = {
    id: string
    qr_token: string
    valor: number
    tipo_gasolina: string
    metodo_pago: string
    cupon_codigo: string | null
    descuento: number
    total: number
    estado: string
    expira_en: string | null
}

// (El gancho central que maneja el formulario de cobro del operador)
export function useAgregarPago() {
    // (Sacamos la sesión para saber qué operador está generando el cobro)
    const { session } = useAuth()

    // (Texto que el operador escribe con el precio de la gasolina)
    const [valor, setValor] = useState('')
    // (La forma en que el cliente pagará por defecto usamos la billetera virtual)
    const [metodoPago, setMetodoPago] = useState<MetodoPagoCliente>('tarjeta_qruta')
    // (El tipo de combustible que se va a despachar por defecto extra)
    const [tipoGasolina, setTipoGasolina] = useState<TipoGasolina>('extra')

    // (Lista de cupones disponibles del operador para aplicar descuento)
    const [cupones, setCupones] = useState<CuponOperador[]>([])
    // (El cupón que el operador elige aplicar al cobro)
    const [cuponSeleccionado, setCuponSeleccionado] = useState<CuponOperador | null>(null)

    // (Spinner del botón de generar QR)
    const [loading, setLoading] = useState(false)
    // (Spinner de la carga inicial de cupones)
    const [loadingData, setLoadingData] = useState(true)

    // (Aquí guardamos el QR generado para mostrarlo en pantalla)
    const [pagoGenerado, setPagoGenerado] = useState<PagoGenerado | null>(null)

    // (La ID del operador para saber quién genera el cobro)
    const operadorId = session?.user?.id

    // (Calculamos el precio numérico real del valor escrito solo cuando cambia el texto)
    const valorNumerico = useMemo(() => {
        const numero = obtenerMontoNumerico(valor)
        // (Si escribió letras devolvemos 0)
        return Number.isNaN(numero) ? 0 : numero
    }, [valor])

    // (Calculamos el descuento que aplica el cupón elegido)
    const descuentoCalculado = useMemo(() => {
        // (Si no hay cupón o el valor es cero no hay descuento)
        if (!cuponSeleccionado || valorNumerico <= 0) return 0

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0)

        // (Si es porcentaje calculamos la proporción matemática)
        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((valorNumerico * valorDescuento) / 100).toFixed(2))
        }

        // (Si es monto fijo lo aplicamos pero sin pasarnos del valor original)
        return Math.min(valorDescuento, valorNumerico)
    }, [cuponSeleccionado, valorNumerico])

    // (El precio final que pagará el cliente después del descuento)
    const totalCalculado = useMemo(() => {
        // (Nunca puede ser negativo)
        return Number(Math.max(valorNumerico - descuentoCalculado, 0).toFixed(2))
    }, [valorNumerico, descuentoCalculado])

    // (Función que trae los cupones activos del operador desde la base de datos)
    const cargarCuponesOperador = useCallback(async () => {
        // (Si no hay sesión no hacemos nada)
        if (!operadorId) return

        // (Intentamos traer los cupones)
        try {
            // (Prendemos el spinner de carga)
            setLoadingData(true)

            // (Le pedimos al servicio los cupones disponibles de este operador)
            const { data, error } = await CuponesService.obtenerCuponesDisponibles(operadorId, 'operador')

            // (Si falla avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones del operador')
                return
            }

            // (Filtramos los que ya se vencieron para no mostrárselos como opción)
            const cuponesDisponibles = (data || []).filter((cupon) => {
                if (!cupon.expira_en) return true
                return new Date(cupon.expira_en) >= new Date()
            })

            // (Guardamos los cupones válidos)
            setCupones(cuponesDisponibles as CuponOperador[])
        } catch (error) {
            // (Atrapamos errores inesperados)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones')
        } finally {
            // (Apagamos el spinner)
            setLoadingData(false)
        }
    }, [operadorId])

    // (Cargamos los cupones apenas el operador entra a la pantalla)
    useEffect(() => {
        cargarCuponesOperador()
    }, [cargarCuponesOperador])

    // (La función principal que crea el QR y lo guarda en Supabase)
    async function generarPagoQr() {
        // (Verificamos que sepamos quién es el operador)
        if (!operadorId) {
            CustomAlert.alert('Error', 'No se pudo obtener el operador actual')
            return
        }

        // (Verificamos que hayan escrito un precio válido)
        if (!valor.trim() || Number.isNaN(valorNumerico) || valorNumerico <= 0) {
            CustomAlert.alert('Valor inválido', 'Ingresa un valor válido mayor a $0.00')
            return
        }

        // (Si el cupón es tan alto que el total quedó en cero no podemos generar el cobro)
        if (totalCalculado <= 0) {
            CustomAlert.alert('Total inválido', 'El total a pagar no puede ser $0.00')
            return
        }

        // (Si todo está bien intentamos generar el QR)
        try {
            // (Prendemos el spinner del botón generar QR)
            setLoading(true)

            // (Buscamos a qué gasolinera está asignado este operador)
            const { data: perfilOperador, error: perfilError } = await AuthService.obtenerPerfil(operadorId)

            // (Si el operador no tiene gasolinera asignada no puede cobrar)
            if (perfilError || !perfilOperador?.gasolinera_id) {
                CustomAlert.alert('Operador sin gasolinera', 'Este operador no tiene una gasolinera asignada')
                return
            }

            // (Generamos un código único e irrepetible para este QR usando nuestro generador de tokens)
            const qrToken = generarTokenQr()

            // (Le damos 5 minutos de vida al QR antes de que expire y se vuelva inútil)
            const expiraEn = new Date()
            expiraEn.setMinutes(expiraEn.getMinutes() + 5)

            // (Empaquetamos todos los datos del cobro)
            const datosPago = {
                qr_token: qrToken,
                operador_id: operadorId,
                // (El cliente se asignará cuando escanee el QR y pague)
                cliente_id: null,
                gasolinera_id: perfilOperador.gasolinera_id,
                valor: valorNumerico,
                tipo_gasolina: tipoGasolina,
                metodo_pago: metodoPago,
                cupon_codigo: cuponSeleccionado?.codigo || null,
                descuento: descuentoCalculado,
                total: totalCalculado,
                // (El cobro nace pendiente y cambia a aprobado cuando el cliente paga)
                estado: 'pendiente',
                expira_en: expiraEn.toISOString(),
                pagado_en: null,
            }

            // (Le pedimos a Supabase que cree este registro y nos devuelva el objeto completo)
            const { data: pago, error: pagoError } = await PagosService.generarPagoPendiente(datosPago)

            // (Si falla la creación avisamos)
            if (pagoError) {
                console.log(pagoError.message)
                CustomAlert.alert('Error', 'No se pudo generar el pago QR')
                return
            }

            // (Guardamos el pago generado para que React Native QR Code lo dibuje)
            setPagoGenerado(pago as PagoGenerado)
            // (Avisamos que todo está listo para que el cliente escanee)
            CustomAlert.alert('QR generado', 'El cliente ya puede escanear este código desde su app')
        } catch (error) {
            // (Si explota algo lo atrapamos)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al generar el pago QR')
        } finally {
            // (Apagamos el spinner)
            setLoading(false)
        }
    }

    // (Función de reseteo para cuando el operador quiere generar un cobro nuevo)
    function crearOtroPago() {
        // (Limpiamos todos los campos del formulario)
        setValor('')
        setMetodoPago('tarjeta_qruta')
        setTipoGasolina('extra')
        setCuponSeleccionado(null)
        // (Borramos el QR anterior de la pantalla)
        setPagoGenerado(null)
    }

    // (Convertimos el token del QR generado a formato JSON para que la librería de QR lo lea bien)
    const qrValue = pagoGenerado
        ? JSON.stringify({ qr_token: pagoGenerado.qr_token })
        : ''

    // (Exportamos todo para que la pantalla dibuje el formulario el QR y los botones)
    return {
        valor,
        setValor,
        metodoPago,
        setMetodoPago,
        tipoGasolina,
        setTipoGasolina,
        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,
        valorNumerico,
        descuentoCalculado,
        totalCalculado,
        loading,
        loadingData,
        pagoGenerado,
        qrValue,
        cargarCuponesOperador,
        generarPagoQr,
        crearOtroPago,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarCuponesOperador el selector de cupones aparecerá vacío aunque el operador tenga descuentos disponibles)
(si quitas generarPagoQr el botón verde de generar cobro no creará nada y ningún cliente podrá escanear para pagar)
(si quitas crearOtroPago el operador quedará atascado viendo el mismo QR ya pagado sin poder cobrar a un nuevo cliente)
(si quitas valorNumerico descuentoCalculado o totalCalculado los precios que se muestran estarán mal y el QR tendrá un monto incorrecto)
*/