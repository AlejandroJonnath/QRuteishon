import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'

import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { PagosService } from '../../services/PagosService'
import { AuthService } from '../../services/AuthService'
import { validarCorreo, validarTelefono, validarCedula } from '../../utils/validators'

// (ESTE ARCHIVO MANEJA TODA LA LÓGICA PARA QUE EL OPERADOR SELECCIONE UN PAGO YA COBRADO Y EMITA UNA FACTURA OFICIAL CON LOS DATOS DEL CLIENTE)

// (Cómo luce un pago ya aprobado que el operador puede facturar)
export type PagoAprobado = {
    // (Identificador único del cobro)
    id: string
    // (El token único del QR que se generó)
    qr_token: string
    // (El operador que lo generó)
    operador_id: string
    // (El cliente que lo pagó)
    cliente_id: string | null
    // (La sucursal donde ocurrió)
    gasolinera_id: string | null
    // (El precio base sin descuento)
    valor: number
    // (El descuento que se aplicó)
    descuento: number
    // (El precio final cobrado)
    total: number
    // (El combustible que se despachó)
    tipo_gasolina: string
    // (Con qué método pagó el cliente)
    metodo_pago: string
    // (El estado que siempre es aprobado en esta lista)
    estado: string
    // (Cuándo exactamente se hizo el pago)
    pagado_en: string | null
    // (Cuándo se creó el registro del pago)
    created_at: string
}

// (El gancho que controla la pantalla de facturación del operador)
export function useFacturaOperador() {
    // (Sacamos la sesión para saber qué operador está emitiendo la factura)
    const { session } = useAuth()

    // (Lista de los últimos pagos aprobados que el operador puede elegir para facturar)
    const [pagos, setPagos] = useState<PagoAprobado[]>([])
    // (El pago específico que el operador seleccionó de la lista)
    const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoAprobado | null>(null)

    // (Todos estos son los datos personales del cliente que irán en la factura)
    // (La cédula del cliente para la factura)
    const [cedula, setCedula] = useState('')
    // (El nombre del cliente)
    const [nombre, setNombre] = useState('')
    // (El apellido del cliente)
    const [apellido, setApellido] = useState('')
    // (El teléfono del cliente)
    const [telefono, setTelefono] = useState('')
    // (El correo del cliente para enviarle la factura)
    const [correo, setCorreo] = useState('')

    // (Spinner para la carga inicial de la lista de pagos)
    const [loadingData, setLoadingData] = useState(true)
    // (Spinner para el botón de emitir factura)
    const [loadingFactura, setLoadingFactura] = useState(false)

    // (La ID del operador que está usando la pantalla)
    const operadorId = session?.user?.id

    // (Función que baja del servidor los últimos pagos cobrados por este operador)
    const cargarPagosAprobados = useCallback(async () => {
        // (Si no hay sesión no hacemos nada)
        if (!operadorId) return

        // (Intentamos la descarga)
        try {
            // (Prendemos el spinner de carga general)
            setLoadingData(true)

            // (Le pedimos al servicio los últimos 20 pagos aprobados de este operador)
            const { data, error } = await PagosService.obtenerPagosAprobados(operadorId, 20)

            // (Si falla avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los pagos aprobados')
                return
            }

            // (Guardamos la lista de pagos en el estado)
            setPagos((data || []) as unknown as PagoAprobado[])
        } catch (error) {
            // (Atrapamos errores raros)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar pagos')
        } finally {
            // (Apagamos el spinner)
            setLoadingData(false)
        }
    }, [operadorId])

    // (Cargamos los pagos apenas el operador entra a la pantalla de facturar)
    useEffect(() => {
        cargarPagosAprobados()
    }, [cargarPagosAprobados])

    // (Función que se llama cuando el operador toca uno de los cobros de la lista)
    async function seleccionarPago(pago: PagoAprobado) {
        // (Guardamos el pago elegido para saber cuál se va a facturar)
        setPagoSeleccionado(pago)

        // (Limpiamos los campos del formulario por si tenían datos de otro cliente anterior)
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')

        // (Si el pago no tiene cliente asignado no podemos autorellenar nada)
        if (!pago.cliente_id) return

        // (Si tiene cliente intentamos buscar su información automáticamente)
        const { data, error } = await AuthService.obtenerPerfil(pago.cliente_id)

        // (Si falla la búsqueda simplemente dejamos los campos vacíos para que el operador los llene manual)
        if (error) {
            console.log(error.message)
            return
        }

        // (Si encontramos el perfil rellenamos automáticamente los campos del formulario)
        if (data) {
            setCedula(data.cedula || '')
            setNombre(data.nombre || '')
            setApellido(data.apellido || '')
            setTelefono(data.telefono || '')
            // (Si el correo está guardado en el perfil también lo ponemos)
        }
    }

    // (La función que valida todos los datos y crea la factura oficial en la base de datos)
    async function generarFactura() {
        // (Verificamos que haya sesión)
        if (!operadorId) {
            CustomAlert.alert('Error', 'No se pudo obtener el operador actual')
            return
        }

        // (Verificamos que hayan elegido un pago de la lista)
        if (!pagoSeleccionado) {
            CustomAlert.alert('Pago requerido', 'Selecciona un pago aprobado para generar la factura')
            return
        }

        // (Verificamos los datos obligatorios del cliente uno por uno)
        if (!cedula.trim()) {
            CustomAlert.alert('Error de Validación', 'La cédula es obligatoria')
            return
        }
        // (Revisamos que la cédula tenga exactamente 10 dígitos)
        if (!validarCedula(cedula)) {
            CustomAlert.alert('Error de Validación', 'La cédula debe tener exactamente 10 números numéricos')
            return
        }
        if (!nombre.trim()) {
            CustomAlert.alert('Error de Validación', 'El nombre es obligatorio')
            return
        }
        if (!apellido.trim()) {
            CustomAlert.alert('Error de Validación', 'El apellido es obligatorio')
            return
        }
        if (!telefono.trim()) {
            CustomAlert.alert('Error de Validación', 'El teléfono es obligatorio')
            return
        }
        // (Revisamos que el teléfono tenga exactamente 10 dígitos)
        if (!validarTelefono(telefono)) {
            CustomAlert.alert('Error de Validación', 'El teléfono debe tener exactamente 10 números numéricos')
            return
        }
        if (!correo.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo es obligatorio')
            return
        }
        // (Revisamos que el correo tenga el formato válido de arroba y dominio)
        if (!validarCorreo(correo)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido')
            return
        }

        // (Si todo está bien intentamos emitir la factura)
        try {
            // (Prendemos el spinner del botón emitir)
            setLoadingFactura(true)

            // (Preguntamos si este pago ya tiene una factura para no hacerla doble)
            const { data: facturaExistente, error: facturaExistenteError } = await PagosService.verificarFacturaExistente(pagoSeleccionado.id)

            // (Si la verificación falla paramos)
            if (facturaExistenteError) {
                console.log(facturaExistenteError.message)
                CustomAlert.alert('Error', 'No se pudo validar si la factura ya existe')
                return
            }

            // (Si ya existe una factura para este pago no dejamos crear otra duplicada)
            if (facturaExistente) {
                CustomAlert.alert('Factura existente', 'Este pago ya tiene una factura generada')
                return
            }

            // (Armamos el paquete completo de datos de la factura)
            const datosFactura = {
                pago_id: pagoSeleccionado.id,
                operador_id: operadorId,
                cliente_id: pagoSeleccionado.cliente_id,
                cedula: cedula.trim(),
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim(),
                correo: correo.trim(),
                // (Sacamos los montos del pago ya registrado para que coincidan exactamente)
                subtotal: Number(pagoSeleccionado.valor || 0),
                descuento: Number(pagoSeleccionado.descuento || 0),
                total: Number(pagoSeleccionado.total || 0),
                estado: 'emitida',
            }

            // (Le pedimos al servicio que inserte la factura en la base de datos)
            const { error } = await PagosService.crearFactura(datosFactura)

            // (Si falla la inserción avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo generar la factura')
                return
            }

            // (Celebramos y mandamos al operador de regreso al inicio)
            CustomAlert.alert(
                'Factura generada',
                'La factura fue emitida correctamente',
                [{ text: 'Aceptar', onPress: () => router.replace('/operador') }]
            )
        } catch (error) {
            // (Por si explota algo inesperado)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al generar la factura')
        } finally {
            // (Apagamos el spinner del botón emitir)
            setLoadingFactura(false)
        }
    }

    // (Exportamos todo para que la pantalla dibuje la lista los cuadros y el botón de emitir)
    return {
        pagos,
        pagoSeleccionado,
        cedula,
        setCedula,
        nombre,
        setNombre,
        apellido,
        setApellido,
        telefono,
        setTelefono,
        correo,
        setCorreo,
        loadingData,
        loadingFactura,
        cargarPagosAprobados,
        seleccionarPago,
        generarFactura,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarPagosAprobados la lista de cobros aparecerá vacía y el operador no podrá elegir a qué cobro emitirle factura)
(si quitas seleccionarPago los cobros de la lista no responderán al toque y el formulario nunca recibirá datos automáticos)
(si quitas generarFactura el botón de emitir será solo decorativo y ninguna factura llegará a la base de datos)
*/