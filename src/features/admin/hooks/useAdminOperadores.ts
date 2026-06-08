import { useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'
import { AdminService } from '@/services/AdminService'
import { validarCorreo, validarTelefono, validarCedula } from '@/utils/validators'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// (ESTE ARCHIVO SE ENCARGA DE GESTIONAR A LOS OPERADORES PERMITIENDO AL ADMINISTRADOR VER QUIÉNES SON CREAR NUEVOS Y ASIGNARLOS A GASOLINERAS)

type EstadoPerfil = 'activo' | 'inactivo'

export type Operador = {
    id: string
    usuario: string | null
    rol: string
    estado: EstadoPerfil
    cedula: string | null
    nombre: string | null
    apellido: string | null
    telefono: string | null
    correo: string | null
    gasolinera_id: string | null
}

export type GasolineraResumen = {
    id: string
    nombre: string
}

export function useAdminOperadores() {
    const queryClient = useQueryClient()
    
    const [operadorSeleccionado, setOperadorSeleccionado] = useState<Operador | null>(null)
    
    const [usuario, setUsuario] = useState('')
    const [cedula, setCedula] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [gasolineraId, setGasolineraId] = useState('')
    const [estado, setEstado] = useState<EstadoPerfil>('activo')

    // (React Query se encarga de la caché y de traer a los operadores y gasolineras)
    const { data = { operadores: [], gasolineras: [] }, isLoading: loadingData, refetch: cargarOperadores } = useQuery({
        queryKey: ['admin', 'usuarios', 'operador'],
        queryFn: async () => {
            const [resOperadores, resGasolineras] = await Promise.all([
                AdminService.obtenerUsuariosPorRol('operador'),
                AdminService.obtenerGasolineras()
            ])

            if (resOperadores.error) {
                console.log(resOperadores.error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los operadores')
                throw new Error(resOperadores.error.message)
            }

            return {
                operadores: (resOperadores.data || []) as Operador[],
                gasolineras: (resGasolineras.data || []) as GasolineraResumen[]
            }
        },
        staleTime: 1000 * 60 * 5, // La caché dura 5 minutos antes de considerarse vieja
    })

    const { operadores, gasolineras } = data;

    // (Manejamos las acciones de guardado y edición con useMutation para no bloquear la UI)
    const { mutateAsync: mutarGuardarOperador, isPending: loadingAction } = useMutation({
        mutationFn: async () => {
            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                rol: 'operador',
                gasolinera_id: gasolineraId.trim(),
            }

            if (operadorSeleccionado) {
                const { error } = await AdminService.actualizarUsuario(operadorSeleccionado.id, datos)
                if (error) throw new Error(error.message)
                return { tipo: 'actualizado' }
            } else {
                const { data, error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos)
                if (error) throw new Error(error.message)

                if (data?.user?.id) {
                    await AdminService.actualizarUsuario(data.user.id, datos)
                }
                return { tipo: 'creado' }
            }
        },
        onSuccess: async (res) => {
            CustomAlert.alert(
                res.tipo === 'actualizado' ? 'Operador actualizado' : 'Operador creado',
                res.tipo === 'actualizado' ? 'Los datos fueron guardados correctamente' : 'El nuevo operador fue registrado en el sistema'
            )
            limpiarFormulario()
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios', 'operador'] })
        },
        onError: (error: any) => {
            console.log(error)
            CustomAlert.alert('Error', error.message || 'Ocurrió un problema al guardar el operador')
        }
    })

    const { mutateAsync: mutarCambiarEstado, isPending: loadingEstado } = useMutation({
        mutationFn: async ({ id, nuevoEstado }: { id: string, nuevoEstado: EstadoPerfil }) => {
            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado)
            if (error) throw new Error(error.message)
            return { id, nuevoEstado }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios', 'operador'] })
        },
        onError: (error: any) => {
            console.log(error)
            CustomAlert.alert('Error', 'No se pudo cambiar el estado del operador')
        }
    })

    function seleccionarOperador(operador: Operador) {
        setOperadorSeleccionado(operador)
        setUsuario(operador.usuario || '')
        setCedula(operador.cedula || '')
        setNombre(operador.nombre || '')
        setApellido(operador.apellido || '')
        setTelefono(operador.telefono || '')
        setCorreo(operador.correo || '')
        setGasolineraId(operador.gasolinera_id || '')
        setEstado(operador.estado || 'activo')
        setPassword('')
    }

    function limpiarFormulario() {
        setOperadorSeleccionado(null)
        setUsuario('')
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')
        setGasolineraId('')
        setPassword('')
        setEstado('activo')
    }

    async function guardarOperador() {
        if (!usuario.trim() || !nombre.trim() || !apellido.trim() || !correo.trim()) {
            CustomAlert.alert('Error de Validación', 'Usuario, nombre, apellido y correo son obligatorios')
            return
        }
        if (!validarCorreo(correo)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido')
            return
        }
        if (cedula.trim() && !validarCedula(cedula)) {
            CustomAlert.alert('Error de Validación', 'La cédula debe tener exactamente 10 números numéricos')
            return
        }
        if (telefono.trim() && !validarTelefono(telefono)) {
            CustomAlert.alert('Error de Validación', 'El teléfono debe tener exactamente 10 números numéricos')
            return
        }
        if (!gasolineraId.trim()) {
            CustomAlert.alert('Error de Validación', 'Selecciona una gasolinera')
            return
        }
        if (!operadorSeleccionado && (!password.trim() || password.length < 6)) {
            CustomAlert.alert('Clave inválida', 'Asigna una contraseña de al menos 6 caracteres')
            return
        }

        await mutarGuardarOperador()
    }

    async function cambiarEstadoOperador(id: string, nuevoEstado: EstadoPerfil) {
        await mutarCambiarEstado({ id, nuevoEstado })
    }

    return {
        operadores,
        gasolineras,
        operadorSeleccionado,
        usuario, setUsuario,
        cedula, setCedula,
        nombre, setNombre,
        apellido, setApellido,
        telefono, setTelefono,
        correo, setCorreo,
        password, setPassword,
        gasolineraId, setGasolineraId,
        estado, setEstado,
        loadingData,
        loadingAction: loadingAction || loadingEstado,
        cargarOperadores,
        seleccionarOperador,
        limpiarFormulario,
        guardarOperador,
        cambiarEstadoOperador,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarOperadores nadie verá la tabla y tampoco se cargarán las gasolineras en el selector dejándolo inútil)
(si quitas seleccionarOperador el botón de editar será decorativo y no llenará la información del trabajador)
(si quitas limpiarFormulario los datos viejos se quedarán embarrados en la pantalla molestando al administrador)
(si quitas guardarOperador el botón azul gigante de abajo dejará de funcionar impidiendo nuevas contrataciones o ediciones)
(si quitas cambiarEstadoOperador será imposible suspender a un trabajador y los inactivos nunca volverán al trabajo)
*/
