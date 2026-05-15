import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'
import { AdminService } from '../../services/AdminService'
import { validarCorreo, validarTelefono, validarCedula } from '../../utils/validators'

// (ESTE ARCHIVO SE ENCARGA DE GESTIONAR A LOS OPERADORES PERMITIENDO AL ADMINISTRADOR VER QUIÉNES SON CREAR NUEVOS Y ASIGNARLOS A GASOLINERAS)

// (Definimos los posibles estados para saber si un operador está trabajando o si lo suspendieron)
type EstadoPerfil = 'activo' | 'inactivo'

// (Molde exacto de cómo se ve un operador en la base de datos para no cruzar variables por error)
export type Operador = {
    // (Identificador único en el sistema)
    id: string
    // (Nombre de usuario para iniciar sesión)
    usuario: string | null
    // (El rol que obligatoriamente será operador aquí)
    rol: string
    // (Estado actual para saber si tiene acceso)
    estado: EstadoPerfil
    // (Número de cédula con validación estricta de 10 dígitos)
    cedula: string | null
    // (Nombres del operador)
    nombre: string | null
    // (Apellidos del operador)
    apellido: string | null
    // (Número de teléfono de 10 dígitos)
    telefono: string | null
    // (Correo electrónico oficial del trabajador)
    correo: string | null
    // (La sucursal o gasolinera a la que pertenece este empleado)
    gasolinera_id: string | null
}

// (Pequeño molde para la lista de gasolineras que mostraremos en el selector)
export type GasolineraResumen = {
    id: string
    nombre: string
}

// (El gancho gigante que conecta la pantalla visual con la base de datos de los operadores)
export function useAdminOperadores() {
    // (Arreglo que almacena toda la lista de operadores que descargamos de Supabase)
    const [operadores, setOperadores] = useState<Operador[]>([])
    // (Aquí guardamos al trabajador específico al que le diste clic para poder editarlo)
    const [operadorSeleccionado, setOperadorSeleccionado] = useState<Operador | null>(null)
    // (Arreglo secundario que guarda la lista de gasolineras disponibles para el selector modal)
    const [gasolineras, setGasolineras] = useState<GasolineraResumen[]>([])

    // (Toda esta lista de estados guarda cada letra que el administrador escribe en el formulario de la derecha)
    const [usuario, setUsuario] = useState('')
    const [cedula, setCedula] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')
    // (La contraseña requerida solo cuando es un empleado nuevo)
    const [password, setPassword] = useState('')
    // (Aquí guardamos la ID de la gasolinera que el administrador eligió en el modal)
    const [gasolineraId, setGasolineraId] = useState('')
    // (Estado inicial del empleado)
    const [estado, setEstado] = useState<EstadoPerfil>('activo')

    // (Interruptor que pone un spinner de carga mientras se descargan las tablas)
    const [loadingData, setLoadingData] = useState(true)
    // (Interruptor para poner un spinner chiquito en el botón de guardar y evitar que le den muchos clics)
    const [loadingAction, setLoadingAction] = useState(false)

    // (Función principal que va hasta Supabase y se trae al mismo tiempo a los operadores y las gasolineras)
    const cargarOperadores = useCallback(async () => {
        // (Intentamos hacer las descargas preparando la red)
        try {
            // (Encendemos el spinner principal)
            setLoadingData(true)

            // (Hacemos dos peticiones a la vez usando PromiseAll para que sea súper rápido)
            const [resOperadores, resGasolineras] = await Promise.all([
                AdminService.obtenerUsuariosPorRol('operador'),
                AdminService.obtenerGasolineras()
            ])

            // (Si la descarga de operadores falla abortamos misión y avisamos)
            if (resOperadores.error) {
                console.log(resOperadores.error.message)
                CustomAlert.alert('Error', 'No se pudieron cargar los operadores')
                return
            }

            // (Guardamos los datos traídos en nuestros estados asegurándonos de que no sean nulos)
            setOperadores((resOperadores.data || []) as Operador[])
            setGasolineras((resGasolineras.data || []) as GasolineraResumen[])
        } catch (error) {
            // (Si algo explota a nivel de conexión o sintaxis lo atrapamos aquí)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar operadores')
        } finally {
            // (Apagamos el spinner gigante de carga)
            setLoadingData(false)
        }
    }, [])

    // (Efecto mágico que lanza la descarga apenas entras a la pantalla de gestionar operadores)
    useEffect(() => {
        cargarOperadores()
    }, [cargarOperadores])

    // (Esta función es tu ayudante personal que rellena todo el formulario cuando le das clic a editar)
    function seleccionarOperador(operador: Operador) {
        // (Anotamos a quién vamos a editar)
        setOperadorSeleccionado(operador)
        // (Empezamos a llenar cuadrito por cuadrito protegiéndonos de valores nulos)
        setUsuario(operador.usuario || '')
        setCedula(operador.cedula || '')
        setNombre(operador.nombre || '')
        setApellido(operador.apellido || '')
        setTelefono(operador.telefono || '')
        setCorreo(operador.correo || '')
        setGasolineraId(operador.gasolinera_id || '')
        setEstado(operador.estado || 'activo')
        // (Jamás cargamos la contraseña antigua por reglas básicas de seguridad)
        setPassword('')
    }

    // (Esta función actúa como un borrador mágico que deja el formulario en blanco listo para alguien nuevo)
    function limpiarFormulario() {
        // (Soltamos al trabajador que estábamos editando)
        setOperadorSeleccionado(null)
        // (Vaciamos todas las cajas de texto una por una)
        setUsuario('')
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')
        setGasolineraId('')
        setPassword('')
        // (Devolvemos el estado a activo por defecto)
        setEstado('activo')
    }

    // (El cerebro de las operaciones que decide si guardamos los cambios de alguien o si creamos un perfil desde cero)
    async function guardarOperador() {
        // (Primero pasamos por los guardias de seguridad para ver que no falte nada)
        if (!usuario.trim()) {
            CustomAlert.alert('Error de Validación', 'El usuario es obligatorio')
            return
        }
        if (!nombre.trim()) {
            CustomAlert.alert('Error de Validación', 'El nombre es obligatorio')
            return
        }
        if (!apellido.trim()) {
            CustomAlert.alert('Error de Validación', 'El apellido es obligatorio')
            return
        }
        if (!correo.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo es obligatorio')
            return
        }
        // (Validamos que el correo tenga pinta de correo real)
        if (!validarCorreo(correo)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido')
            return
        }
        // (Si el admin decidió meter cédula confirmamos que no falte ni sobre un solo número)
        if (cedula.trim() && !validarCedula(cedula)) {
            CustomAlert.alert('Error de Validación', 'La cédula debe tener exactamente 10 números numéricos')
            return
        }
        // (Lo mismo para el celular del operador)
        if (telefono.trim() && !validarTelefono(telefono)) {
            CustomAlert.alert('Error de Validación', 'El teléfono debe tener exactamente 10 números numéricos')
            return
        }
        // (Es vital que el operador pertenezca a una sucursal)
        if (!gasolineraId.trim()) {
            CustomAlert.alert('Error de Validación', 'Selecciona una gasolinera')
            return
        }

        // (Si llegamos aquí es porque todos los datos son perfectos e intentamos mandarlos a la nube)
        try {
            // (Prendemos el spinner del botón guardar para que el usuario espere pacientemente)
            setLoadingAction(true)

            // (Empaquetamos la cajita de información que enviaremos)
            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                // (Bloqueamos el rol en operador para evitar hackeos)
                rol: 'operador',
                gasolinera_id: gasolineraId.trim(),
            }

            // (Si ya teníamos a un trabajador agarrado procedemos a actualizarlo)
            if (operadorSeleccionado) {
                // (Enviamos la caja de datos nuevos apuntando a la ID del trabajador)
                const { error } = await AdminService.actualizarUsuario(operadorSeleccionado.id, datos)

                // (Si hubo un fallo en la nube frenamos)
                if (error) {
                    console.log(error.message)
                    CustomAlert.alert('Error', 'No se pudo actualizar el operador')
                    return
                }

                // (Festejamos que se guardaron los cambios)
                CustomAlert.alert('Operador actualizado', 'Los datos fueron guardados correctamente')
            } else {
                // (Si era alguien nuevo nos aseguramos de que no traten de crearlo sin clave)
                if (!password.trim() || password.length < 6) {
                    CustomAlert.alert('Clave inválida', 'Asigna una contraseña de al menos 6 caracteres')
                    // (Apagamos el spinner porque nos detuvimos)
                    setLoadingAction(false)
                    return
                }

                // (Mandamos a registrar el correo la clave y la caja de datos)
                const { data, error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos)

                // (Si Supabase nos dice que el correo ya existe o algo similar mostramos el error)
                if (error) {
                    console.log(error.message)
                    CustomAlert.alert('Error al crear', error.message)
                    return
                }

                // (CORRECCIÓN DE BUG: A veces el trigger de Supabase fuerza a todos los nuevos a ser 'cliente')
                // (Para evitar eso, forzamos una actualización inmediata con los datos reales usando la ID recién creada)
                if (data?.user?.id) {
                    await AdminService.actualizarUsuario(data.user.id, datos)
                }

                // (Damos la bienvenida oficial al nuevo empleado)
                CustomAlert.alert('Operador creado', 'El nuevo operador fue registrado en el sistema')
            }

            // (Al final de todo borramos el formulario para evitar confusiones)
            limpiarFormulario()
            // (Le damos un respiro de 1 segundo a la base de datos para que el trigger termine de crear el perfil antes de buscarlo)
            await new Promise(resolve => setTimeout(resolve, 1000))
            // (Y actualizamos la lista para que veas al operador nuevecito o editado)
            await cargarOperadores()
        } catch (error) {
            // (Si cae un asteroide atrapamos el error)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al guardar el operador')
        } finally {
            // (Devolvemos el botón guardar a la vida apagando el spinner)
            setLoadingAction(false)
        }
    }

    // (Esta función sirve para congelar o descongelar a un trabajador usando el switch)
    async function cambiarEstadoOperador(id: string, nuevoEstado: EstadoPerfil) {
        // (Intentamos hacer el cambio en la base de datos)
        try {
            // (Prendemos el spinner del switch)
            setLoadingAction(true)

            // (Mandamos la orden a Supabase)
            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado)

            // (Si no se puede paramos todo)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo cambiar el estado del operador')
                return
            }

            // (Recargamos para ver el botoncito cambiar de color en vivo)
            await cargarOperadores()
        } catch (error) {
            // (Si pasa algo fuera de control lo atrapamos)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cambiar el estado')
        } finally {
            // (Apagamos el spinner)
            setLoadingAction(false)
        }
    }

    // (Entregamos todas estas funciones listas para ser inyectadas en la pantalla visual)
    return {
        operadores,
        gasolineras,
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
