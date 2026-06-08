import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'

import { useAuth } from '@/context/AuthContext'
import { AdminService } from '@/services/AdminService'
import { generarTokenQr } from '@/utils/generators'
import { obtenerRangoMesActual } from '@/utils/dateHelpers'

// (ESTE ARCHIVO SE ENCARGA DE TODA LA MAGIA DE LOS CUPONES PERMITIENDO AL ADMINISTRADOR GENERAR CÓDIGOS DE DESCUENTO MASIVOS Y REVISAR LOS EXISTENTES)

// (Le explicamos a TypeScript cómo luce exactamente un cupón en la base de datos para no mezclar datos por accidente)
export type CuponGlobal = {
    // (La ID única que le da la base de datos al cupón)
    id: string
    // (El código real de letras y números que el cliente va a escribir en la app)
    codigo: string
    // (La ID de quien creó este cupón en este caso será la ID del administrador)
    propietario_id: string | null
    // (El rol de quien lo creó)
    propietario_rol: string | null
    // (Para saber si regalamos dólares fijos o un porcentaje de descuento)
    tipo_descuento: 'monto' | 'porcentaje'
    // (Cuánto vale este cupón numéricamente)
    valor_descuento: number
    // (Para saber si el cupón se quema después del primer uso)
    uso_unico: boolean
    // (Si el cupón está disponible o si ya fue canjeado)
    estado: string
    // (Fecha exacta en la que este cupón deja de servir)
    expira_en: string | null
    // (Fecha de nacimiento del cupón)
    created_at: string
}

// (El gancho que junta la lógica de cupones para entregarla a la pantalla visual)
export function useAdminCupones() {
    // (Nos traemos el contexto de sesión para saber quién está usando la app ahorita)
    const { session } = useAuth()
    // (Sacamos la ID del administrador directamente de la sesión para firmar los cupones que crearemos)
    const adminId = session?.user?.id

    // (Arreglo gigante donde guardaremos todos los cupones históricos que nos traigamos de la base de datos)
    const [cupones, setCupones] = useState<CuponGlobal[]>([])
    
    // (Todos estos estados de aquí controlan el formulario chiquito de la pantalla para crear cupones)
    // (Por defecto queremos generar al menos 1 cupón)
    const [cantidad, setCantidad] = useState('1')
    // (Por defecto regalaremos un monto fijo de dólares en lugar de porcentaje)
    const [tipoDescuento, setTipoDescuento] = useState<'monto' | 'porcentaje'>('monto')
    // (Aquí se guarda lo que escribe el admin sobre el valor del cupón)
    const [valorDescuento, setValorDescuento] = useState('')
    // (Cuántos días de vida tendrán los nuevos cupones por defecto 30)
    const [diasValidez, setDiasValidez] = useState('30')
    
    // (Interruptor de carga para la tabla completa de cupones)
    const [loadingData, setLoadingData] = useState(true)
    // (Interruptor de carga chiquito para el botón de generar cupones)
    const [loadingAction, setLoadingAction] = useState(false)

    // (Función maestra que va a Supabase y se trae todos los cupones habidos y por haber)
    const cargarCupones = useCallback(async () => {
        // (Intentamos atrapar los datos sin que la app colapse si no hay internet)
        try {
            // (Avisamos que empezamos a descargar)
            setLoadingData(true)

            // (Le pedimos a nuestro servicio que haga la magia y nos traiga la tabla completa)
            const { data, error } = await AdminService.obtenerTodosLosCupones()

            // (Si la base de datos nos dice que no nos detenemos y avisamos al admin)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones')
                return
            }

            // (Guardamos toda la lista de cupones en nuestro estado para que la tabla los dibuje)
            setCupones((data || []) as CuponGlobal[])
        } catch (error) {
            // (Si pasa algo completamente inesperado como un rayo cayendo en el servidor lo atrapamos aquí)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones')
        } finally {
            // (Sin importar qué pase apagamos el mensaje de cargando)
            setLoadingData(false)
        }
    }, [])

    // (Efecto de React que ejecuta la descarga apenas el administrador pise la pantalla de cupones)
    useEffect(() => {
        cargarCupones()
    }, [cargarCupones])

    // (Esta función es la encargada de fabricar cupones de forma masiva y mandarlos a Supabase)
    async function generarLoteCupones() {
        // (Primero verificamos que sepamos quién es el admin que está creando esto)
        if (!adminId) {
            CustomAlert.alert('Error', 'No se pudo obtener el usuario administrador')
            return
        }

        // (Convertimos los textos que escribió el admin a números reales que la compu entienda)
        const cant = parseInt(cantidad, 10)
        const val = parseFloat(valorDescuento)
        const dias = parseInt(diasValidez, 10)

        // (Si trató de engañarnos poniendo letras o un número ridículo de cupones lo detenemos)
        if (isNaN(cant) || cant <= 0 || cant > 100) {
            CustomAlert.alert('Cantidad inválida', 'Puedes generar entre 1 y 100 cupones a la vez')
            return
        }

        // (Si intentó hacer un cupón de 0 dólares o menos no lo dejamos avanzar)
        if (isNaN(val) || val <= 0) {
            CustomAlert.alert('Valor inválido', 'El descuento debe ser mayor a 0')
            return
        }

        // (Si intentó hacer que el cupón expire en 0 días le decimos que no)
        if (isNaN(dias) || dias < 1) {
            CustomAlert.alert('Días inválidos', 'El cupón debe durar al menos 1 día')
            return
        }

        // (Si todos los datos son válidos intentamos fabricarlos)
        try {
            // (Prendemos el spinner del botón para que no genere miles de cupones por darle doble clic)
            setLoadingAction(true)

            // (Calculamos la fecha exacta de muerte de estos cupones sumando los días que eligió)
            const fechaExpiracion = new Date()
            fechaExpiracion.setDate(fechaExpiracion.getDate() + dias)

            // (Usamos magia de arreglos para fabricar tantos cupones como haya pedido el admin de un solo golpe)
            const cuponesNuevos = Array.from({ length: cant }).map(() => ({
                // (Creamos el texto del cupón cortando un pedazo de un generador aleatorio y pegándole la palabra ADMIN)
                codigo: `ADMIN-${generarTokenQr().split('-')[2]}`,
                // (Le ponemos la firma de quién los creó)
                propietario_id: adminId,
                // (Anotamos que fue un admin el creador)
                propietario_rol: 'admin',
                tipo_descuento: tipoDescuento,
                valor_descuento: val,
                // (Todos los cupones que hace el admin se queman después del primer uso)
                uso_unico: true,
                estado: 'disponible',
                // (Le pegamos su fecha de muerte en formato de texto estandarizado)
                expira_en: fechaExpiracion.toISOString(),
            }))

            // (Le pasamos toda la caja de cupones nuevos a nuestro servicio para que los mande a la base de datos)
            const { error } = await AdminService.generarCuponesAutomaticos(cuponesNuevos)

            // (Si la base de datos rechaza la caja gigante detenemos el proceso)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron generar los cupones')
                return
            }

            // (Festejamos avisándole al administrador cuántos cupones nacieron hoy)
            CustomAlert.alert('Cupones generados', `Se crearon exitosamente ${cant} cupones`)
            
            // (Limpiamos los campos del formulario para que pueda hacer más cupones frescos después)
            setCantidad('1')
            setValorDescuento('')
            
            // (Recargamos la tabla visual para que vea los códigos recién nacidos al instante)
            await cargarCupones()
        } catch (error) {
            // (Atrapamos errores raros)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al generar los cupones')
        } finally {
            // (Apagamos la ruedita del botón siempre)
            setLoadingAction(false)
        }
    }

    // (Esta función chiquita nos sirve para prender o apagar un cupón existente usando un switch)
    async function cambiarEstadoCupon(id: string, nuevoEstado: string) {
        // (Intentamos actualizarlo allá arriba en la nube)
        try {
            // (Prendemos la ruedita)
            setLoadingAction(true)

            // (Le decimos a Supabase que machaque el estado viejo de este cupón específico)
            const { error } = await AdminService.cambiarEstadoCupon(id, nuevoEstado)

            // (Si no nos hace caso avisamos del problema)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo cambiar el estado del cupón')
                return
            }

            // (Recargamos la lista para que el cambio de color se vea en la pantalla inmediatamente)
            await cargarCupones()
        } catch (error) {
            // (Por si falla algo más allá de nuestra comprensión)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cambiar el estado')
        } finally {
            // (Apagamos la ruedita)
            setLoadingAction(false)
        }
    }

    // (Exportamos todo el paquete de funciones para que la interfaz visual juegue con ellas)
    return {
        cupones,
        cantidad,
        setCantidad,
        tipoDescuento,
        setTipoDescuento,
        valorDescuento,
        setValorDescuento,
        diasValidez,
        setDiasValidez,
        loadingData,
        loadingAction,
        cargarCupones,
        generarLoteCupones,
        cambiarEstadoCupon,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarCupones la pantalla te mostrará un hermoso vacío porque la tabla jamás sabrá qué cupones existen)
(si quitas generarLoteCupones el botón de generar estará muerto y nadie en el mundo podrá fabricar nuevos descuentos masivos)
(si quitas cambiarEstadoCupon te quedarás sin el poder divino de suspender manualmente un cupón que te robaron o se filtró)
*/
