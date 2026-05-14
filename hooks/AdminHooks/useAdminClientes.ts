import { useCallback, useEffect, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { AdminService } from '../../services/AdminService';

type EstadoPerfil = 'activo' | 'inactivo';

export type Cliente = {
    id: string;
    usuario: string | null;
    rol: string;
    estado: EstadoPerfil;
    cedula: string | null;
    nombre: string | null;
    apellido: string | null;
    telefono: string | null;
    correo: string | null;
};

export function useAdminClientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState(''); // Solo para creación
    const [estado, setEstado] = useState<EstadoPerfil>('activo');

    const [loadingData, setLoadingData] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    const cargarClientes = useCallback(async () => {
        try {
            setLoadingData(true);

            // Le pedimos los datos a nuestro servicio
            const { data, error } = await AdminService.obtenerUsuariosPorRol('cliente');

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudieron cargar los clientes.');
                return;
            }

            setClientes((data || []) as Cliente[]);
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar clientes.');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    function seleccionarCliente(cliente: Cliente) {
        setClienteSeleccionado(cliente);
        setUsuario(cliente.usuario || '');
        setCedula(cliente.cedula || '');
        setNombre(cliente.nombre || '');
        setApellido(cliente.apellido || '');
        setTelefono(cliente.telefono || '');
        setCorreo(cliente.correo || '');
        setEstado(cliente.estado || 'activo');
        setPassword('');
    }

    function limpiarFormulario() {
        setClienteSeleccionado(null);
        setUsuario('');
        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setCorreo('');
        setPassword('');
        setEstado('activo');
    }

    async function guardarCliente() {
        if (!usuario.trim() || !nombre.trim() || !apellido.trim() || !correo.trim()) {
            CustomAlert.alert('Campos incompletos', 'Completa usuario, nombre, apellido y correo.');
            return;
        }

        try {
            setLoadingAction(true);

            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                rol: 'cliente',
                gasolinera_id: null, // Los clientes no tienen gasolinera
            };

            if (clienteSeleccionado) {
                // Actualizamos uno existente
                const { error } = await AdminService.actualizarUsuario(clienteSeleccionado.id, datos);

                if (error) {
                    console.log(error.message);
                    CustomAlert.alert('Error', 'No se pudo actualizar el cliente.');
                    return;
                }

                CustomAlert.alert('Cliente actualizado', 'Los datos fueron guardados correctamente.');
            } else {
                // Creamos uno nuevo (pedimos clave)
                if (!password.trim() || password.length < 6) {
                    CustomAlert.alert('Clave inválida', 'Para crear un cliente debes asignar una contraseña de al menos 6 caracteres.');
                    setLoadingAction(false);
                    return;
                }

                const { error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos);

                if (error) {
                    console.log(error.message);
                    CustomAlert.alert('Error al crear', error.message);
                    return;
                }

                CustomAlert.alert('Cliente creado', 'El nuevo cliente fue registrado en el sistema.');
            }

            limpiarFormulario();
            await cargarClientes();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al guardar el cliente.');
        } finally {
            setLoadingAction(false);
        }
    }

    async function cambiarEstadoCliente(id: string, nuevoEstado: EstadoPerfil) {
        try {
            setLoadingAction(true);

            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado);

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudo cambiar el estado del cliente.');
                return;
            }

            await cargarClientes();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cambiar el estado.');
        } finally {
            setLoadingAction(false);
        }
    }

    return {
        clientes,
        clienteSeleccionado,
        usuario,
        setUsuario,
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
        password,
        setPassword,
        estado,
        setEstado,
        loadingData,
        loadingAction,
        cargarClientes,
        seleccionarCliente,
        limpiarFormulario,
        guardarCliente,
        cambiarEstadoCliente,
    };
}