import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'

import { AdminService } from '@/services/AdminService'

// (ESTE ARCHIVO SE ENCARGA DE DESCARGAR Y CALCULAR TODO EL DINERO QUE HA ENTRADO A LA APP POR RECARGAS Y PAGOS DE GASOLINA PARA MOSTRARLO EN EL DASHBOARD)

// (Le enseñamos a la compu qué datos exactos trae un pago reciente de gasolina)
export type PagoReciente = {
    // (Identificador del pago)
    id: string
    // (Cuántos dólares costó)
    total: number
    // (Qué gasolina le pusieron al auto)
    tipo_gasolina: string
    // (La fecha exacta en la que se completó el pago)
    pagado_en: string
}

// (Le enseñamos a la compu cómo se ve una recarga de saldo que hizo un cliente)
export type RecargaReciente = {
    // (Identificador de la recarga)
    id: string
    // (Cuántos dólares le metió a su billetera virtual)
    monto: number
    // (Si pagó con tarjeta o transferencia)
    metodo: string
    // (Fecha exacta en la que el dinero entró a la app)
    created_at: string
}

// (El gancho que hace los cálculos matemáticos para la pantalla visual)
export function useAdminAnaliticas() {
    // (Aquí guardamos la lista de todos los pagos de gasolina que nos manda Supabase)
    const [pagos, setPagos] = useState<PagoReciente[]>([])
    // (Y aquí guardamos la lista de todas las recargas de saldo de los clientes)
    const [recargas, setRecargas] = useState<RecargaReciente[]>([])
    
    // (Este número guarda la suma total de TODO el dinero que se pagó en gasolina)
    const [ingresosPagos, setIngresosPagos] = useState(0)
    // (Este número guarda la suma total de TODO el dinero que los clientes metieron a la app)
    const [ingresosRecargas, setIngresosRecargas] = useState(0)

    // (Interruptor de carga para poner a girar la ruedita mientras sumamos el dinero)
    const [loadingData, setLoadingData] = useState(true)

    // (La función cerebrito que va a Supabase trae las tablas y hace sumas)
    const cargarAnaliticas = useCallback(async () => {
        // (Intentamos hacerlo con cuidado por si la red falla)
        try {
            // (Prendemos la ruedita para que el administrador espere un segundo)
            setLoadingData(true)

            // (Llamamos a nuestro servicio para que nos traiga el historial completo de dinero movido)
            const data = await AdminService.obtenerDetallesAnaliticas()

            // (Si el servidor nos devuelve un error lo atrapamos de inmediato)
            if (data.error) {
                console.log(data.error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar las analíticas')
                return
            }

            // (Acomodamos los datos limpios en arreglos listos para sumar asegurándonos que no vengan nulos)
            const pagosLista = (data.pagos || []) as PagoReciente[]
            const recargasLista = (data.recargas || []) as RecargaReciente[]

            // (Guardamos las listas en los estados para que la pantalla pueda dibujar tablitas si quiere)
            setPagos(pagosLista)
            setRecargas(recargasLista)

            // (Hacemos matemáticas rápidas sumando el total de cada pago de gasolina uno por uno)
            const totalPagos = pagosLista.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
            // (Hacemos lo mismo sumando cada dolar de las recargas virtuales)
            const totalRecargas = recargasLista.reduce((acc, curr) => acc + Number(curr.monto || 0), 0)

            // (Guardamos los totales calculados en nuestros estados listos para ser dibujados)
            setIngresosPagos(totalPagos)
            setIngresosRecargas(totalRecargas)

        } catch (error) {
            // (Atrapamos errores catastróficos que la compu no entienda)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar las analíticas')
        } finally {
            // (Apagamos la ruedita de carga)
            setLoadingData(false)
        }
    }, [])

    // (Apenas entres a la pantalla de estadísticas la compu empezará a sumar sola sin que toques nada)
    useEffect(() => {
        cargarAnaliticas()
    }, [cargarAnaliticas])

    // (Exportamos todos los números y listas para que las gráficas de la app cobren vida)
    return {
        pagos,
        recargas,
        ingresosPagos,
        ingresosRecargas,
        loadingData,
        cargarAnaliticas,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarAnaliticas las gráficas y los números gigantes de ingresos en el panel siempre dirán 0 dólares)
*/
