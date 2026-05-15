import { useState, useEffect } from 'react'
import { CustomAlert } from '../../utils/AlertManager'

import { useAuth } from '../../context/AuthContext'
import { BilleteraService } from '../../services/BilleteraService'

// (ESTE ARCHIVO MANEJA TODAS LAS TARJETAS DE CRÉDITO Y DÉBITO QUE EL CLIENTE VINCULA A SU CUENTA PERMITIÉNDOLE AGREGAR NUEVAS O DESACTIVAR LAS QUE YA NO QUIERE USAR)

// (Los únicos dos tipos de tarjetas que acepta nuestra app)
export type TipoTarjeta = 'credito' | 'debito'

// (Molde que describe cómo se ve una tarjeta guardada en la base de datos)
export type MetodoPago = {
    // (Identificador único de esta tarjeta)
    id: string
    // (A qué cuenta pertenece esta tarjeta)
    tipo: TipoTarjeta
    // (La marca de la tarjeta como Visa Mastercard etc)
    marca: string | null
    // (Los últimos cuatro dígitos del número de la tarjeta)
    ultimos_4: string
    // (El nombre del titular de la tarjeta)
    titular: string | null
    // (Si está disponible para cobrar o si fue eliminada)
    estado: string
}

// (El gancho que maneja toda la pantalla de mis métodos de pago)
export function useMetodosPagos() {
    // (Sacamos la sesión para saber a qué usuario le pertenecen estas tarjetas)
    const { session } = useAuth()

    // (Los estados del formulario de agregar tarjeta nueva)
    // (El tipo que elegirá el usuario entre crédito y débito)
    const [tipo, setTipo] = useState<TipoTarjeta>('credito')
    // (La marca que el usuario escribirá como Visa o Mastercard)
    const [marca, setMarca] = useState('')
    // (Los cuatro numeritos finales de su plástico)
    const [ultimos4, setUltimos4] = useState('')
    // (El nombre completo del dueño de la tarjeta)
    const [titular, setTitular] = useState('')

    // (La lista de todas las tarjetas activas que tiene registradas)
    const [metodos, setMetodos] = useState<MetodoPago[]>([])
    
    // (Spinner para el botón de agregar tarjeta)
    const [loading, setLoading] = useState(false)
    // (Spinner para la carga inicial de la lista de tarjetas)
    const [loadingData, setLoadingData] = useState(true)

    // (Guardamos la ID del usuario para no ir a buscarla en la sesión cada vez)
    const usuarioId = session?.user?.id

    // (Efecto que carga las tarjetas automaticamente apenas se monta la pantalla)
    useEffect(() => {
        cargarMetodos()
    }, [usuarioId])

    // (Función que va a Supabase a traer todas las tarjetas activas del usuario)
    async function cargarMetodos() {
        // (Si no sabemos quién es no hacemos nada)
        if (!usuarioId) return

        // (Intentamos la descarga)
        try {
            // (Prendemos el spinner de carga general)
            setLoadingData(true)

            // (Le pedimos al servicio los métodos de pago activos de este usuario)
            const { data, error } = await BilleteraService.obtenerMetodosPago(usuarioId)

            // (Si falla la descarga avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los métodos de pago')
                return
            }

            // (Guardamos las tarjetas en el estado asegurándonos que no sea nulo)
            setMetodos(data || [])
        } catch (error) {
            // (Si explota algo raro lo atrapamos)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar las tarjetas')
        } finally {
            // (Apagamos el spinner general)
            setLoadingData(false)
        }
    }

    // (La función que se llama cuando el usuario toca el botón de guardar una tarjeta nueva)
    async function agregarMetodoPago() {
        // (Verificamos que sepamos quién está)
        if (!usuarioId) {
            CustomAlert.alert('Error', 'No se pudo obtener el usuario actual')
            return
        }

        // (Verificamos que haya llenado los tres campos mínimos)
        if (!marca.trim() || !ultimos4.trim() || !titular.trim()) {
            CustomAlert.alert('Campos incompletos', 'Completa la marca, últimos 4 dígitos y titular')
            return
        }

        // (Expresión regular para asegurarnos de que sí o sí sean exactamente 4 numeritos y nada más)
        if (!/^\d{4}$/.test(ultimos4.trim())) {
            CustomAlert.alert('Dato inválido', 'Los últimos 4 dígitos deben ser exactamente 4 números')
            return
        }

        // (Si pasó todas las revisiones intentamos guardarla)
        try {
            // (Prendemos el spinner del botón guardar)
            setLoading(true)

            // (Empaquetamos los datos listos para viajar a la base de datos)
            const datosMetodo = {
                usuario_id: usuarioId,
                tipo,
                marca: marca.trim(),
                ultimos_4: ultimos4.trim(),
                titular: titular.trim(),
                // (La ponemos activa por defecto cuando la creamos)
                estado: 'activa',
            }

            // (Le pedimos al servicio que la inserte en la tabla de métodos de pago)
            const { error } = await BilleteraService.agregarMetodoPago(datosMetodo)

            // (Si falla la inserción avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo agregar la tarjeta')
                return
            }

            // (Celebramos que la tarjeta fue guardada)
            CustomAlert.alert('Tarjeta agregada', 'El método de pago fue registrado correctamente')

            // (Limpiamos el formulario para que quede listo para una siguiente tarjeta)
            setMarca('')
            setUltimos4('')
            setTitular('')
            setTipo('credito')

            // (Recargamos la lista para que la nueva tarjeta aparezca al instante)
            await cargarMetodos()
        } catch (error) {
            // (Por si algo explota de manera catastrófica)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al agregar la tarjeta')
        } finally {
            // (Apagamos el spinner del botón guardar)
            setLoading(false)
        }
    }

    // (Esta función marca la tarjeta como inactiva cuando el usuario decide eliminarla)
    async function desactivarMetodo(id: string) {
        // (Intentamos desactivarla)
        try {
            // (Prendemos el spinner del botón)
            setLoading(true)

            // (Le decimos al servicio que marque esta tarjeta como inactiva en vez de borrarla)
            const { error } = await BilleteraService.desactivarMetodo(id)

            // (Si falla avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo desactivar la tarjeta')
                return
            }

            // (Recargamos la lista para que la tarjeta desaparezca de la pantalla)
            await cargarMetodos()
        } catch (error) {
            // (Atrapamos errores inesperados)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al desactivar la tarjeta')
        } finally {
            // (Apagamos el spinner)
            setLoading(false)
        }
    }

    // (Empaquetamos todas las variables y funciones para que la pantalla las use)
    return {
        tipo,
        setTipo,
        marca,
        setMarca,
        ultimos4,
        setUltimos4,
        titular,
        setTitular,
        metodos,
        loading,
        loadingData,
        agregarMetodoPago,
        desactivarMetodo
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarMetodos la pantalla de métodos de pago siempre aparecerá vacía y el usuario pensará que no tiene tarjetas)
(si quitas agregarMetodoPago el formulario de agregar tarjeta quedará de adorno y nadie podrá guardar un nuevo plástico)
(si quitas desactivarMetodo el botón de eliminar tarjeta no hará nada y las tarjetas robadas o vencidas nunca podrán quitarse)
*/
