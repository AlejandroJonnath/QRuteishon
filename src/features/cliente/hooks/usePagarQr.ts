import { useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'

import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { router } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { PagosService } from '@/services/PagosService'
import { BilleteraService } from '@/services/BilleteraService'
import { extraerToken } from '@/utils/formatters'
import { generarYCompartirFacturaCliente } from '@/utils/GenerarFacturaPdf'

// (ESTE ARCHIVO CONTROLA TODA LA EXPERIENCIA DE PAGAR CON QR DESDE QUE SE ACTIVA LA CÁMARA HASTA QUE SE DESCUENTA EL SALDO DE LA BILLETERA Y SE OFRECE LA FACTURA)

// (Molde exacto de cómo luce un pago QR en la base de datos para no confundir las variables)
export type PagoQr = {
    // (Identificador único del cobro)
    id: string
    // (El código único encriptado dentro del QR que generó el operador)
    qr_token: string
    // (Quién generó este cobro)
    operador_id: string
    // (Quién lo pagó si es que alguien ya lo pagó)
    cliente_id: string | null
    // (La sucursal donde se generó)
    gasolinera_id: string | null
    // (El precio base sin descuento)
    valor: number
    // (El tipo de combustible elegido por el operador)
    tipo_gasolina: string
    // (Con qué método decidió pagar el cliente)
    metodo_pago: string
    // (Si se aplicó un cupón de descuento)
    cupon_codigo: string | null
    // (Cuánto se le rebajó al total)
    descuento: number
    // (El precio final que se le cobró)
    total: number
    // (En qué estado está el cobro pendiente aprobado vencido)
    estado: string
    // (Cuándo expira y se vuelve inútil el QR)
    expira_en: string | null
    // (Cuándo se hizo efectivo el pago)
    pagado_en: string | null
}

// (El gancho que le da vida a la pantalla de la cámara para pagar con QR)
export function usePagarQr() {
    // (Sacamos la sesión para saber quién va a pagar)
    const { session } = useAuth()
    // (Pedimos permiso a la cámara del celular usando el hook de expo-camera)
    const [permission, requestPermission] = useCameraPermissions()
    
    // (Interruptor que evita que la cámara procese el mismo QR 50 veces en un segundo)
    const [scanned, setScanned] = useState(false)
    
    // (Spinner para cuando estamos consultando la base de datos sobre un QR)
    const [loadingPago, setLoadingPago] = useState(false)

    // (Esta función se dispara automáticamente cada vez que la cámara detecta un código de barras o QR)
    async function handleBarcodeScanned(result: BarcodeScanningResult) {
        // (Si ya procesamos uno o estamos esperando la respuesta ignoramos los demás destellos de la cámara)
        if (scanned || loadingPago) return

        // (Marcamos que ya escaneamos algo para bloquear lecturas repetidas)
        setScanned(true)

        // (Usamos nuestro helper para limpiar y extraer solo el token del texto crudo del QR)
        const token = extraerToken(result.data)

        // (Si el QR estaba vacío o era basura avisamos)
        if (!token) {
            CustomAlert.alert('QR inválido', 'No se pudo leer el código QR', [
                {
                    text: 'Intentar otra vez',
                    // (Al presionar el botón desbloqueamos la cámara para que vuelva a intentarlo)
                    onPress: () => setScanned(false),
                },
            ])
            return
        }

        // (Si el token tiene sentido vamos a buscar qué cobro tiene adentro)
        await buscarPago(token)
    }

    // (Esta función toma el token limpio y busca en la base si existe ese pago)
    async function buscarPago(token: string) {
        // (Intentamos la consulta)
        try {
            // (Prendemos el spinner de carga para que el usuario sepa que estamos buscando)
            setLoadingPago(true)

            // (Le preguntamos a Supabase si hay algún cobro con ese token)
            const { data: pago, error } = await PagosService.buscarPagoPorToken(token)

            // (Si el servidor nos falla desbloqueamos la cámara para reintentar)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo consultar el pago QR', [
                    {
                        text: 'Intentar otra vez',
                        onPress: () => setScanned(false),
                    },
                ])
                return
            }

            // (Si el token no coincide con nada en la base informamos que no existe)
            if (!pago) {
                CustomAlert.alert('QR no encontrado', 'No existe un pago asociado a este QR', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ])
                return
            }

            // (Si el pago ya fue cobrado o expiró no se puede pagar dos veces)
            if (pago.estado !== 'pendiente') {
                CustomAlert.alert(
                    'QR no disponible',
                    `Este QR ya tiene estado: ${pago.estado}`,
                    [
                        {
                            text: 'Escanear otro',
                            onPress: () => setScanned(false),
                        },
                    ]
                )
                return
            }

            // (Si ya se pasó la hora de expiración lo matamos en la base y avisamos)
            if (pago.expira_en && new Date(pago.expira_en) < new Date()) {
                // (Marcamos el QR como vencido para que no moleste a nadie más)
                await PagosService.marcarVencido(pago.id)

                CustomAlert.alert('QR vencido', 'Este código QR ya expiró', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ])
                return
            }

            // (Formateamos el total a dos decimales para mostrarlo bonito en el modal)
            const total = Number(pago.total || 0).toFixed(2)

            // (Le pedimos confirmación al cliente antes de quitarle el dinero)
            CustomAlert.alert(
                'Confirmar pago',
                `¿Estás seguro de pagar $${total} por gasolina ${pago.tipo_gasolina}?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        // (Si cancela desbloqueamos la cámara para que escanee otro)
                        onPress: () => setScanned(false),
                    },
                    {
                        text: 'Sí, pagar',
                        // (Si confirma procedemos con el cobro real)
                        onPress: () => procesarPago(pago),
                    },
                ]
            )
        } catch (error) {
            // (Si explota algo raro avisamos y desbloqueamos la cámara)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al leer el QR', [
                {
                    text: 'Intentar otra vez',
                    onPress: () => setScanned(false),
                },
            ])
        } finally {
            // (Apagamos el spinner de consulta)
            setLoadingPago(false)
        }
    }

    // (La función más delicada que descuenta el dinero y marca el pago como aprobado)
    async function procesarPago(pago: PagoQr) {
        // (Sacamos la ID del cliente que está pagando en este momento)
        const usuarioId = session?.user?.id

        // (Si no sabemos quién es rechazamos el pago)
        if (!usuarioId) {
            CustomAlert.alert('Error', 'No se pudo obtener el usuario actual')
            setScanned(false)
            return
        }

        // (Intentamos el cobro real)
        try {
            // (Prendemos el spinner)
            setLoadingPago(true)

            // (Convertimos el total a número para poder hacer matemáticas con él)
            const total = Number(pago.total || 0)

            // (Si por alguna razón rara el total es cero rechazamos)
            if (total <= 0) {
                CustomAlert.alert('Pago inválido', 'El total del pago no es válido')
                setScanned(false)
                return
            }

            // (Si el operador configuró que se pague con la billetera virtual de la app ejecutamos el proceso completo)
            if (pago.metodo_pago === 'tarjeta_qruta') {
                // (Buscamos la billetera del cliente para ver su saldo actual)
                const { data: billetera, error: billeteraError } = await BilleteraService.obtenerBilletera(usuarioId)

                // (Si no podemos consultar la billetera rechazamos)
                if (billeteraError) {
                    console.log(billeteraError.message)
                    CustomAlert.alert('Error', 'No se pudo consultar tu billetera')
                    setScanned(false)
                    return
                }

                // (Si la billetera no existe o está congelada no podemos cobrar)
                if (!billetera || billetera.estado !== 'activa') {
                    CustomAlert.alert('Billetera inactiva o no encontrada', 'Tu billetera no está lista')
                    setScanned(false)
                    return
                }

                // (Verificamos que tenga suficiente para pagar el combustible)
                const saldoActual = Number(billetera.saldo || 0)

                if (saldoActual < total) {
                    CustomAlert.alert(
                        'Saldo insuficiente',
                        `Tu saldo actual es $${saldoActual.toFixed(2)} y el pago es de $${total.toFixed(2)}`
                    )
                    setScanned(false)
                    return
                }

                // (Calculamos cuánto le quedará después del cobro)
                const nuevoSaldo = Number((saldoActual - total).toFixed(2))

                // (Le entregamos todo al servicio para que haga la transacción atómica completa)
                const result = await PagosService.procesarPagoBilletera(
                    pago, 
                    usuarioId, 
                    billetera.id, 
                    nuevoSaldo
                )

                // (Si falló algo que no sea el simple historial de movimientos detenemos todo)
                if (result.error && result.paso !== 'movimiento') {
                    console.log(result.error.message)
                    CustomAlert.alert('Error', `Ocurrió un problema en el paso: ${result.paso}`)
                    setScanned(false)
                    return
                }
            }

            // (Si todo fue bien le damos la enhorabuena con dos botones)
            CustomAlert.alert(
                'Pago aprobado',
                `Se realizó el pago de $${total.toFixed(2)} correctamente`,
                [
                    {
                        text: 'Aceptar',
                        // (Si solo acepta lo mandamos de regreso al panel)
                        onPress: () => router.replace('/(cliente)'),
                    },
                    {
                        text: 'Descargar Factura',
                        // (Si quiere el comprobante primero generamos el PDF y luego lo mandamos)
                        onPress: async () => {
                            await generarYCompartirFacturaCliente(pago)
                            router.replace('/(cliente)')
                        },
                    },
                ]
            )
        } catch (error) {
            // (Si algo explota en plena transacción desbloqueamos la cámara)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al procesar el pago')
            setScanned(false)
        } finally {
            // (Apagamos el spinner de pago)
            setLoadingPago(false)
        }
    }

    // (Entregamos a la pantalla todo lo necesario para que la cámara funcione y los botones respondan)
    return {
        permission,
        requestPermission,
        scanned,
        setScanned,
        loadingPago,
        handleBarcodeScanned,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas handleBarcodeScanned la cámara nunca hará nada aunque el usuario apunte al QR perfectamente)
(si quitas buscarPago el token escaneado se quedará en la memoria sin saber si es un cobro válido o un papel cualquiera)
(si quitas procesarPago el modal de confirmación aparecerá pero el botón de pagar no restará dinero ni cambiará el estado del cobro)
*/
