import { useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'
import { AdminService } from '@/services/AdminService'
import { validarCorreo, validarTelefono, validarCedula } from '@/utils/validators'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// (ESTE ARCHIVO SE ENCARGA DE TODA LA GESTIÓN DE CLIENTES PERMITIENDO AL ADMINISTRADOR VERLOS CREARLOS EDITARLOS O BLOQUEARLOS)

type EstadoPerfil = 'activo' | 'inactivo'

export type Cliente = {
    id: string
    usuario: string | null
    rol: string
    estado: EstadoPerfil
    cedula: string | null
    nombre: string | null
    apellido: string | null
    telefono: string | null
    correo: string | null
}

export function useAdminClientes() {
    const queryClient = useQueryClient()
    
    // (Aquí atrapamos al cliente al que el admin le dio clic para editarlo)
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

    // (Todos estos estados de aquí abajo guardan lo que el admin escribe letra por letra en los cuadritos de texto)
    const [usuario, setUsuario] = useState('')
    const [cedula, setCedula] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [estado, setEstado] = useState<EstadoPerfil>('activo')

    // (React Query se encarga de la caché y de traer a los 6000 clientes solo cuando es necesario, haciéndolo instantáneo al navegar)
    const { data: clientes = [], isLoading: loadingData, refetch: cargarClientes } = useQuery({
        queryKey: ['admin', 'usuarios', 'cliente'],
        queryFn: async () => {
            const { data, error } = await AdminService.obtenerUsuariosPorRol('cliente')
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los clientes')
                throw new Error(error.message)
            }
            return (data || []) as Cliente[]
        },
        staleTime: 1000 * 60 * 5, // La caché dura 5 minutos antes de considerarse vieja
    })

    // (Manejamos las acciones de guardado y edición con useMutation para no bloquear la UI)
    const { mutateAsync: mutarGuardarCliente, isPending: loadingAction } = useMutation({
        mutationFn: async () => {
            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                rol: 'cliente',
                gasolinera_id: null,
            }

            if (clienteSeleccionado) {
                const { error } = await AdminService.actualizarUsuario(clienteSeleccionado.id, datos)
                if (error) throw new Error(error.message)
                return { tipo: 'actualizado' }
            } else {
                const { error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos)
                if (error) throw new Error(error.message)
                return { tipo: 'creado' }
            }
        },
        onSuccess: async (res) => {
            CustomAlert.alert(
                res.tipo === 'actualizado' ? 'Cliente actualizado' : 'Cliente creado',
                res.tipo === 'actualizado' ? 'Los datos fueron guardados correctamente' : 'El nuevo cliente fue registrado en el sistema'
            )
            limpiarFormulario()
            // Invalidamos la caché para que se traigan los nuevos clientes de fondo sin bloquear el hilo
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios', 'cliente'] })
        },
        onError: (error: any) => {
            console.log(error)
            CustomAlert.alert('Error', error.message || 'Ocurrió un problema al guardar el cliente')
        }
    })

    const { mutateAsync: mutarCambiarEstado, isPending: loadingEstado } = useMutation({
        mutationFn: async ({ id, nuevoEstado }: { id: string, nuevoEstado: EstadoPerfil }) => {
            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado)
            if (error) throw new Error(error.message)
            return { id, nuevoEstado }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios', 'cliente'] })
        },
        onError: (error: any) => {
            console.log(error)
            CustomAlert.alert('Error', 'No se pudo cambiar el estado del cliente')
        }
    })

    function seleccionarCliente(cliente: Cliente) {
        setClienteSeleccionado(cliente)
        setUsuario(cliente.usuario || '')
        setCedula(cliente.cedula || '')
        setNombre(cliente.nombre || '')
        setApellido(cliente.apellido || '')
        setTelefono(cliente.telefono || '')
        setCorreo(cliente.correo || '')
        setEstado(cliente.estado || 'activo')
        setPassword('')
    }

    function limpiarFormulario() {
        setClienteSeleccionado(null)
        setUsuario('')
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')
        setPassword('')
        setEstado('activo')
    }

    async function guardarCliente() {
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
        if (!clienteSeleccionado && (!password.trim() || password.length < 6)) {
            CustomAlert.alert('Clave inválida', 'Para crear un cliente debes asignar una contraseña de al menos 6 caracteres')
            return
        }

        await mutarGuardarCliente()
    }

    async function cambiarEstadoCliente(id: string, nuevoEstado: EstadoPerfil) {
        await mutarCambiarEstado({ id, nuevoEstado })
    }

    return {
        clientes,
        clienteSeleccionado,
        usuario, setUsuario,
        cedula, setCedula,
        nombre, setNombre,
        apellido, setApellido,
        telefono, setTelefono,
        correo, setCorreo,
        password, setPassword,
        estado, setEstado,
        loadingData,
        loadingAction: loadingAction || loadingEstado,
        cargarClientes,
        seleccionarCliente,
        limpiarFormulario,
        guardarCliente,
        cambiarEstadoCliente,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarClientes la lista aparecerá en blanco y parecerá que la gasolinera no tiene ni un solo cliente)
(si quitas seleccionarCliente el botón azul no hará nada y será imposible traer los datos del cliente al formulario para editarlos)
(si quitas limpiarFormulario los textos viejos se quedarán pegados y será un dolor de cabeza crear a alguien nuevo)
(si quitas guardarCliente todo el formulario quedará de adorno porque el botón verde estará muerto)
(si quitas cambiarEstadoCliente los clientes bloqueados jamás podrán volver a entrar y los malos nunca podrán ser bloqueados)
*/