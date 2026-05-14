import { useCallback, useEffect, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { AdminService } from '../../services/AdminService';

type EstadoPerfil = 'activo' | 'inactivo';

export type Administrador = {
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

export function useAdminAdministradores() {
    const [administradores, setAdministradores] = useState<Administrador[]>([]);
    const [adminSeleccionado, setAdminSeleccionado] = useState<Administrador | null>(null);

    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [estado, setEstado] = useState<EstadoPerfil>('activo');

    const [loadingData, setLoadingData] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    const cargarAdministradores = useCallback(async () => {
        try {
            setLoadingData(true);

            const { data, error } = await AdminService.obtenerUsuariosPorRol('admin');

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudieron cargar los administradores.');
                return;
            }

            setAdministradores((data || []) as Administrador[]);
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar administradores.');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        cargarAdministradores();
    }, [cargarAdministradores]);

    function seleccionarAdmin(admin: Administrador) {
        setAdminSeleccionado(admin);
        setUsuario(admin.usuario || '');
        setCedula(admin.cedula || '');
        setNombre(admin.nombre || '');
        setApellido(admin.apellido || '');
        setTelefono(admin.telefono || '');
        setCorreo(admin.correo || '');
        setEstado(admin.estado || 'activo');
        setPassword('');
    }

    function limpiarFormulario() {
        setAdminSeleccionado(null);
        setUsuario('');
        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setCorreo('');
        setPassword('');
        setEstado('activo');
    }

    async function guardarAdministrador() {
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
                rol: 'admin',
                gasolinera_id: null,
            };

            if (adminSeleccionado) {
                const { error } = await AdminService.actualizarUsuario(adminSeleccionado.id, datos);

                if (error) {
                    console.log(error.message);
                    CustomAlert.alert('Error', 'No se pudo actualizar el administrador.');
                    return;
                }

                CustomAlert.alert('Administrador actualizado', 'Los datos fueron guardados correctamente.');
            } else {
                if (!password.trim() || password.length < 6) {
                    CustomAlert.alert('Clave inválida', 'Asigna una contraseña de al menos 6 caracteres.');
                    setLoadingAction(false);
                    return;
                }

                const { error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos);

                if (error) {
                    console.log(error.message);
                    CustomAlert.alert('Error al crear', error.message);
                    return;
                }

                CustomAlert.alert('Admin creado', 'El nuevo administrador fue registrado en el sistema.');
            }

            limpiarFormulario();
            await cargarAdministradores();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al guardar el administrador.');
        } finally {
            setLoadingAction(false);
        }
    }

    async function cambiarEstadoAdmin(id: string, nuevoEstado: EstadoPerfil) {
        try {
            setLoadingAction(true);

            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado);

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudo cambiar el estado.');
                return;
            }

            await cargarAdministradores();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema.');
        } finally {
            setLoadingAction(false);
        }
    }

    return {
        administradores,
        adminSeleccionado,
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
        cargarAdministradores,
        seleccionarAdmin,
        limpiarFormulario,
        guardarAdministrador,
        cambiarEstadoAdmin,
    };
}
