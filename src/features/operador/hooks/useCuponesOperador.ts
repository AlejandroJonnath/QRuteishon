import * as Crypto from 'expo-crypto'
import { CustomAlert } from '@/utils/AlertManager'

import { useAuth } from '@/context/AuthContext'
import { CuponesService } from '@/services/CuponesService'
import { obtenerRangoMesActual } from '@/utils/dateHelpers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
    const queryClient = useQueryClient()

    // (La ID del operador logueado)
    const operadorId = session?.user?.id

    // (Obtenemos los cupones usando React Query para manejar la caché y estados de carga automáticamente)
    const { data: cupones = [], isLoading: loadingData, refetch: cargarCupones } = useQuery({
        queryKey: ['cupones', 'operador', operadorId],
        queryFn: async () => {
            if (!operadorId) return []
            const { data, error } = await CuponesService.obtenerCuponesDisponibles(operadorId, 'operador')
            
            if (error) {
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones')
                throw new Error(error.message)
            }
            return (data || []) as CuponOperador[]
        },
        enabled: !!operadorId,
    })

    // (Manejamos la creación del cupón usando useMutation)
    const { mutateAsync: crearCuponMensual, isPending: loadingCrear } = useMutation({
        mutationFn: async () => {
            if (!operadorId) throw new Error('No se pudo obtener el operador actual')

            const { inicioMes, inicioSiguienteMes, finMes } = obtenerRangoMesActual()

            const { data: cuponExistente, error: existeError } = await CuponesService.verificarCuponMesActual(
                operadorId, 
                inicioMes, 
                inicioSiguienteMes
            )

            if (existeError) throw new Error(existeError.message)

            if (cuponExistente) {
                CustomAlert.alert('Cupón ya creado', `Ya tienes un cupón asignado este mes: ${cuponExistente.codigo}`)
                return null
            }

            const ahora = new Date()
            const anio = ahora.getFullYear()
            const mes = String(ahora.getMonth() + 1).padStart(2, '0')
            const random = Crypto.randomUUID().split('-')[0].toUpperCase().substring(0, 4)
            const codigo = `QRUTA-OP-${anio}${mes}-${random}`

            const datosCupon = {
                codigo,
                propietario_id: operadorId,
                propietario_rol: 'operador',
                tipo_descuento: 'porcentaje' as const,
                valor_descuento: 5,
                uso_unico: true,
                estado: 'disponible' as const,
                usado_en_pago_id: null,
                expira_en: finMes.toISOString(),
            }

            const { error } = await CuponesService.crearCupon(datosCupon)
            if (error) throw new Error(error.message)

            return codigo
        },
        onSuccess: (codigo) => {
            if (codigo) {
                CustomAlert.alert('Cupón creado', `Se creó tu cupón mensual: ${codigo}`)
                // (Invalida la caché para que React Query recargue la lista de cupones en segundo plano)
                queryClient.invalidateQueries({ queryKey: ['cupones', 'operador', operadorId] })
            }
        },
        onError: (error: any) => {
            console.log(error)
            if (error.message !== 'No se pudo obtener el operador actual') {
                CustomAlert.alert('Error inesperado', 'Ocurrió un problema al crear el cupón')
            } else {
                CustomAlert.alert('Error', error.message)
            }
        }
    })

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