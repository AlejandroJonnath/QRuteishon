import { useState } from 'react'
import { CustomAlert } from '@/utils/AlertManager'
import { AdminService } from '@/services/AdminService'
import { validarCorreo, validarTelefono, validarCedula } from '@/utils/validators'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// (ESTE ARCHIVO CONTIENE TODA LA LÓGICA PARA LEER, CREAR, ACTUALAR Y CAMBIAR EL ESTADO DE LOS ADMINISTRADORES EN EL PANEL DE CONTROL)

type EstadoPerfil = 'activo' | 'inactivo'

export type Administrador = {
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

export function useAdminAdministradores() {
    const queryClient = useQueryClient()
    
    const [adminSeleccionado, setAdminSeleccionado] = useState<Administrador | null>(null)

    const [usuario, setUsuario] = useState('')
    const [cedula, setCedula] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [estado, setEstado] = useState<EstadoPerfil>('activo')

    // (React Query se encarga de la caché y de traer a los administradores solo cuando es necesario, haciéndolo instantáneo al navegar)
    const { data: administradores = [], isLoading: loadingData, refetch: cargarAdministradores } = useQuery({
        queryKey: ['admin', 'usuarios', 'admin'],
        queryFn: async () => {
            const { data, error } = await AdminService.obtenerUsuariosPorRol('admin')
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los administradores')
                throw new Error(error.message)
            }
            return (data || []) as Administrador[]
        },
        staleTime: 1000 * 60 * 5, // La caché dura 5 minutos antes de considerarse vieja
    })

    // (Manejamos las acciones de guardado y edición con useMutation para no bloquear la UI)
    const { mutateAsync: mutarGuardarAdministrador, isPending: loadingAction } = useMutation({
        mutationFn: async () => {
            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                rol: 'admin',
                gasolinera_id: null,
            }

            if (adminSeleccionado) {
                const { error } = await AdminService.actualizarUsuario(adminSeleccionado.id, datos)
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
                res.tipo === 'actualizado' ? 'Administrador actualizado' : 'Admin creado',
                res.tipo === 'actualizado' ? 'Los datos fueron guardados correctamente' : 'El nuevo administrador fue registrado en el sistema'
            )
            limpiarFormulario()
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios', 'admin'] })
        },
        onError: (error: any) => {
            console.log(error)
            CustomAlert.alert('Error', error.message || 'Ocurrió un problema al guardar el administrador')
        }
    })

    const { mutateAsync: mutarCambiarEstado, isPending: loadingEstado } = useMutation({
        mutationFn: async ({ id, nuevoEstado }: { id: string, nuevoEstado: EstadoPerfil }) => {
            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado)
            if (error) throw new Error(error.message)
            return { id, nuevoEstado }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios', 'admin'] })
        },
        onError: (error: any) => {
            console.log(error)
            CustomAlert.alert('Error', 'No se pudo cambiar el estado')
        }
    })

    function seleccionarAdmin(admin: Administrador) {
        setAdminSeleccionado(admin)
        setUsuario(admin.usuario || '')
        setCedula(admin.cedula || '')
        setNombre(admin.nombre || '')
        setApellido(admin.apellido || '')
        setTelefono(admin.telefono || '')
        setCorreo(admin.correo || '')
        setEstado(admin.estado || 'activo')
        setPassword('')
    }

    function limpiarFormulario() {
        setAdminSeleccionado(null)
        setUsuario('')
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')
        setPassword('')
        setEstado('activo')
    }

    async function guardarAdministrador() {
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
        if (!adminSeleccionado && (!password.trim() || password.length < 6)) {
            CustomAlert.alert('Clave inválida', 'Asigna una contraseña de al menos 6 caracteres')
            return
        }

        await mutarGuardarAdministrador()
    }

    async function cambiarEstadoAdmin(id: string, nuevoEstado: EstadoPerfil) {
        await mutarCambiarEstado({ id, nuevoEstado })
    }

    return {
        administradores,
        adminSeleccionado,
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
        cargarAdministradores,
        seleccionarAdmin,
        limpiarFormulario,
        guardarAdministrador,
        cambiarEstadoAdmin,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarAdministradores la tabla del panel de control se quedará vacía y parecerá que no hay nadie en el sistema)
(si quitas seleccionarAdmin los botones de editar de la tabla no harán absolutamente nada y nadie podrá rellenar el formulario)
(si quitas limpiarFormulario cuando crees o edites a alguien el texto se quedará atascado en las cajas y tendrás que borrarlo a mano)
(si quitas guardarAdministrador tu botón verde hermoso de crear dejará de funcionar y será imposible meter o actualizar gente)
(si quitas cambiarEstadoAdmin los botones de switch para banear o activar a los usuarios se romperán y todos tendrán acceso eterno)
*/
