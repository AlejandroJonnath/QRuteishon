import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AdminService } from '../../services/AdminService';

type EstadoPerfil = 'activo' | 'inactivo';

export type Operador = {
    id: string;
    usuario: string | null;
    rol: string;
    estado: EstadoPerfil;
    cedula: string | null;
    nombre: string | null;
    apellido: string | null;
    telefono: string | null;
    correo: string | null;
    gasolinera_id: string | null;
};

export function useAdminOperadores() {
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [operadorSeleccionado, setOperadorSeleccionado] = useState<Operador | null>(null);

    const [usuario, setUsuario] = useState('');
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [gasolineraId, setGasolineraId] = useState('');
    const [estado, setEstado] = useState<EstadoPerfil>('activo');

    const [loadingData, setLoadingData] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    const cargarOperadores = useCallback(async () => {
        try {
            setLoadingData(true);

            const { data, error } = await AdminService.obtenerUsuariosPorRol('operador');

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los operadores.');
                return;
            }

            setOperadores((data || []) as Operador[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar operadores.');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        cargarOperadores();
    }, [cargarOperadores]);

    function seleccionarOperador(operador: Operador) {
        setOperadorSeleccionado(operador);
        setUsuario(operador.usuario || '');
        setCedula(operador.cedula || '');
        setNombre(operador.nombre || '');
        setApellido(operador.apellido || '');
        setTelefono(operador.telefono || '');
        setCorreo(operador.correo || '');
        setGasolineraId(operador.gasolinera_id || '');
        setEstado(operador.estado || 'activo');
        setPassword('');
    }

    function limpiarFormulario() {
        setOperadorSeleccionado(null);
        setUsuario('');
        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setCorreo('');
        setGasolineraId('');
        setPassword('');
        setEstado('activo');
    }

    async function guardarOperador() {
        if (!usuario.trim() || !nombre.trim() || !apellido.trim() || !correo.trim() || !gasolineraId.trim()) {
            Alert.alert('Campos incompletos', 'Completa usuario, nombre, apellido, correo y la ID de la gasolinera.');
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
                rol: 'operador',
                gasolinera_id: gasolineraId.trim(),
            };

            if (operadorSeleccionado) {
                const { error } = await AdminService.actualizarUsuario(operadorSeleccionado.id, datos);

                if (error) {
                    console.log(error.message);
                    Alert.alert('Error', 'No se pudo actualizar el operador.');
                    return;
                }

                Alert.alert('Operador actualizado', 'Los datos fueron guardados correctamente.');
            } else {
                if (!password.trim() || password.length < 6) {
                    Alert.alert('Clave inválida', 'Asigna una contraseña de al menos 6 caracteres.');
                    setLoadingAction(false);
                    return;
                }

                const { error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos);

                if (error) {
                    console.log(error.message);
                    Alert.alert('Error al crear', error.message);
                    return;
                }

                Alert.alert('Operador creado', 'El nuevo operador fue registrado en el sistema.');
            }

            limpiarFormulario();
            await cargarOperadores();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al guardar el operador.');
        } finally {
            setLoadingAction(false);
        }
    }

    async function cambiarEstadoOperador(id: string, nuevoEstado: EstadoPerfil) {
        try {
            setLoadingAction(true);

            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado);

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo cambiar el estado del operador.');
                return;
            }

            await cargarOperadores();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cambiar el estado.');
        } finally {
            setLoadingAction(false);
        }
    }

    return {
        operadores,
        operadorSeleccionado,
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
        gasolineraId,
        setGasolineraId,
        estado,
        setEstado,
        loadingData,
        loadingAction,
        cargarOperadores,
        seleccionarOperador,
        limpiarFormulario,
        guardarOperador,
        cambiarEstadoOperador,
    };
}
