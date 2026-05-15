import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'
import { AdminService } from '../../services/AdminService'
import { validarCorreo, validarTelefono, validarCedula } from '../../utils/validators'

// (ESTE ARCHIVO SE ENCARGA DE TODA LA GESTIÓN DE CLIENTES PERMITIENDO AL ADMINISTRADOR VERLOS CREARLOS EDITARLOS O BLOQUEARLOS)

// (Definimos los posibles estados de un cliente en nuestro sistema)
type EstadoPerfil = 'activo' | 'inactivo'

// (Le indicamos a TypeScript cómo es la estructura de un cliente para no equivocarnos de variables)
export type Cliente = {
    // (Identificador único generado por la base de datos)
    id: string
    // (Nombre de usuario que usan en la app)
    usuario: string | null
    // (El rol que siempre será cliente en esta tabla)
    rol: string
    // (Estado actual para saber si pueden usar la app o si están bloqueados)
    estado: EstadoPerfil
    // (Su número de cédula exacto de 10 dígitos)
    cedula: string | null
    // (Nombres del cliente)
    nombre: string | null
    // (Apellidos del cliente)
    apellido: string | null
    // (Número de celular para contactos)
    telefono: string | null
    // (Correo con el que inician sesión)
    correo: string | null
}

// (El gancho que junta toda la magia y se la entrega a la pantalla de clientes)
export function useAdminClientes() {
    // (Arreglo principal donde guardamos la lista de todos los clientes que nos manda el servidor)
    const [clientes, setClientes] = useState<Cliente[]>([])
    // (Aquí atrapamos al cliente al que el admin le dio clic para editarlo)
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

    // (Todos estos estados de aquí abajo guardan lo que el admin escribe letra por letra en los cuadritos de texto)
    const [usuario, setUsuario] = useState('')
    const [cedula, setCedula] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')
    // (La contraseña solo aparece y sirve cuando creamos a un cliente por primera vez)
    const [password, setPassword] = useState('')
    // (El estado por defecto siempre lo ponemos en activo para que no nazcan bloqueados)
    const [estado, setEstado] = useState<EstadoPerfil>('activo')

    // (Este interruptor enciende un spinner gigante mientras traemos los datos por primera vez)
    const [loadingData, setLoadingData] = useState(true)
    // (Este interruptor enciende un pequeño spinner dentro de los botones para evitar que le den dos veces)
    const [loadingAction, setLoadingAction] = useState(false)

    // (Esta es la función maestra que va hasta Supabase a traerse toda la lista de clientes)
    const cargarClientes = useCallback(async () => {
        // (Intentamos hacer el viaje a la base de datos protegiéndonos de errores)
        try {
            // (Avisamos a la pantalla que estamos cargando datos)
            setLoadingData(true)

            // (Le pedimos a nuestro servicio que nos traiga exclusivamente a los perfiles con rol de cliente)
            const { data, error } = await AdminService.obtenerUsuariosPorRol('cliente')

            // (Si la base de datos nos responde con una cachetada nos detenemos)
            if (error) {
                // (Registramos el error en consola para poder investigar después)
                console.log(error.message)
                // (Le mostramos un modal bonito al usuario para que no se asuste)
                CustomAlert.alert('Error', 'No se pudieron cargar los clientes')
                return
            }

            // (Guardamos los datos traídos en nuestro arreglo y si viene vacío le ponemos un arreglo en blanco)
            setClientes((data || []) as Cliente[])
        } catch (error) {
            // (Si el celular se queda sin internet o pasa algo muy raro atrapamos el error aquí)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar clientes')
        } finally {
            // (Sin importar si funcionó o falló apagamos el spinner de carga gigante)
            setLoadingData(false)
        }
    }, [])

    // (Efecto especial de React que ejecuta la función de cargar apenas entras a la pantalla de clientes)
    useEffect(() => {
        cargarClientes()
    }, [cargarClientes])

    // (Esta función es la que despierta cuando le das clic al botón azul de editar en la tabla)
    // (Toma la información de ese cliente específico y rellena el formulario de la derecha mágicamente)
    function seleccionarCliente(cliente: Cliente) {
        // (Guardamos a la víctima seleccionada)
        setClienteSeleccionado(cliente)
        // (Rellenamos cada uno de los cuadritos de texto verificando que no vengan nulos)
        setUsuario(cliente.usuario || '')
        setCedula(cliente.cedula || '')
        setNombre(cliente.nombre || '')
        setApellido(cliente.apellido || '')
        setTelefono(cliente.telefono || '')
        setCorreo(cliente.correo || '')
        setEstado(cliente.estado || 'activo')
        // (Por regla de seguridad jamás mostramos contraseñas así que vaciamos este campo)
        setPassword('')
    }

    // (Esta función es tu botón de reset que borra absolutamente todo lo que hayas escrito)
    function limpiarFormulario() {
        // (Soltamos al cliente que teníamos agarrado para editar)
        setClienteSeleccionado(null)
        // (Vaciamos todas y cada una de las cajitas de texto)
        setUsuario('')
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')
        setPassword('')
        // (Volvemos a poner el interruptor de estado en activo)
        setEstado('activo')
    }

    // (Esta función enorme es el corazón del formulario que decide si creas alguien nuevo o si modificas a alguien)
    async function guardarCliente() {
        // (Chequeamos que no se hagan los chistosos dejando el usuario en blanco)
        if (!usuario.trim()) {
            CustomAlert.alert('Error de Validación', 'El usuario es obligatorio')
            return
        }
        // (Verificamos que haya nombre)
        if (!nombre.trim()) {
            CustomAlert.alert('Error de Validación', 'El nombre es obligatorio')
            return
        }
        // (Verificamos que haya apellido)
        if (!apellido.trim()) {
            CustomAlert.alert('Error de Validación', 'El apellido es obligatorio')
            return
        }
        // (Verificamos que haya correo)
        if (!correo.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo es obligatorio')
            return
        }
        // (Verificamos que el correo sea de verdad y no un invento usando nuestro super regex)
        if (!validarCorreo(correo)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido')
            return
        }
        // (Si decidieron poner cédula revisamos con lupa que sean exactamente 10 números)
        if (cedula.trim() && !validarCedula(cedula)) {
            CustomAlert.alert('Error de Validación', 'La cédula debe tener exactamente 10 números numéricos')
            return
        }
        // (Si decidieron poner teléfono revisamos con lupa que sean exactamente 10 números)
        if (telefono.trim() && !validarTelefono(telefono)) {
            CustomAlert.alert('Error de Validación', 'El teléfono debe tener exactamente 10 números numéricos')
            return
        }

        // (Si superamos todos los guardias de seguridad intentamos guardar)
        try {
            // (Prendemos el spinner chiquito del botón guardar)
            setLoadingAction(true)

            // (Empaquetamos todos los datos limpios y listos para viajar a la base de datos)
            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                // (Le estampamos el sello de cliente para que no se cuele a otras partes)
                rol: 'cliente',
                // (Los clientes no tienen gasolinera así que mandamos esto nulo a propósito)
                gasolinera_id: null,
            }

            // (Si atrapamos a un cliente previamente significa que vamos a actualizarlo)
            if (clienteSeleccionado) {
                // (Le pedimos a Supabase que machaque los datos viejos con los nuevos en esta ID)
                const { error } = await AdminService.actualizarUsuario(clienteSeleccionado.id, datos)

                // (Si hubo pelea en la base de datos mostramos el error)
                if (error) {
                    console.log(error.message)
                    CustomAlert.alert('Error', 'No se pudo actualizar el cliente')
                    return
                }

                // (Avisamos con bombos y platillos que se guardó todo bien)
                CustomAlert.alert('Cliente actualizado', 'Los datos fueron guardados correctamente')
            } else {
                // (Si nadie estaba seleccionado significa que es un cliente virgen y necesita contraseña)
                if (!password.trim() || password.length < 6) {
                    CustomAlert.alert('Clave inválida', 'Para crear un cliente debes asignar una contraseña de al menos 6 caracteres')
                    // (Apagamos el spinner del botón porque no vamos a avanzar)
                    setLoadingAction(false)
                    return
                }

                // (Mandamos a crear el perfil usando el correo la contraseña y nuestro paquete de datos)
                const { error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos)

                // (Si falló la creación del usuario te lo hacemos saber)
                if (error) {
                    console.log(error.message)
                    CustomAlert.alert('Error al crear', error.message)
                    return
                }

                // (Festejamos que la familia creció)
                CustomAlert.alert('Cliente creado', 'El nuevo cliente fue registrado en el sistema')
            }

            // (Borramos el formulario para no dejar evidencias)
            limpiarFormulario()
            // (Le damos un respiro de 1 segundo a la base de datos para que el trigger termine de crear el perfil antes de buscarlo)
            await new Promise(resolve => setTimeout(resolve, 1000))
            // (Y recargamos la lista gigante para que el cliente nuevo o el editado aparezcan al instante)
            await cargarClientes()
        } catch (error) {
            // (Si cayó un rayo atrapamos el error)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al guardar el cliente')
        } finally {
            // (Pase lo que pase devolvemos el botón guardar a la normalidad apagando el spinner)
            setLoadingAction(false)
        }
    }

    // (Esta función cortita te deja cambiar entre activo e inactivo con el switch sin entrar a editar)
    async function cambiarEstadoCliente(id: string, nuevoEstado: EstadoPerfil) {
        // (Tratamos de hacer el flip en la base de datos)
        try {
            // (Prendemos spinner)
            setLoadingAction(true)

            // (Avisamos a Supabase que le cambie el switch a este usuario)
            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado)

            // (Si falla detenemos la fiesta)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo cambiar el estado del cliente')
                return
            }

            // (Si funcionó refrescamos la tabla para que el switch se mueva en la pantalla)
            await cargarClientes()
        } catch (error) {
            // (Si perdemos conexión atrapamos el error)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cambiar el estado')
        } finally {
            // (Apagamos el spinner)
            setLoadingAction(false)
        }
    }

    // (Aquí empaquetamos todas nuestras funciones y variables para que la pantalla de la app pueda usarlas libremente)
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