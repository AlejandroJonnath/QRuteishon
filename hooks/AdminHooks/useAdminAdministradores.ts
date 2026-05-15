import { useCallback, useEffect, useState } from 'react'
import { CustomAlert } from '../../utils/AlertManager'
import { AdminService } from '../../services/AdminService'
import { validarCorreo, validarTelefono, validarCedula } from '../../utils/validators'

// (ESTE ARCHIVO CONTIENE TODA LA LÓGICA PARA LEER, CREAR, ACTUALAR Y CAMBIAR EL ESTADO DE LOS ADMINISTRADORES EN EL PANEL DE CONTROL)

// (Definimos los tipos de datos que usará TypeScript para saber si alguien está activo o inactivo)
type EstadoPerfil = 'activo' | 'inactivo'

// (Le enseñamos a TypeScript qué forma tiene exactamente un administrador en nuestra base de datos)
export type Administrador = {
    // (El identificador único de toda la vida)
    id: string
    // (Nombre de usuario en la app)
    usuario: string | null
    // (El rol que siempre será admin aquí)
    rol: string
    // (Para saber si puede entrar o si lo banearon)
    estado: EstadoPerfil
    // (La cédula que ahora validamos a 10 dígitos)
    cedula: string | null
    // (Nombres del admin)
    nombre: string | null
    // (Apellidos del admin)
    apellido: string | null
    // (Número de teléfono igual a 10 dígitos)
    telefono: string | null
    // (Correo con el que va a iniciar sesión)
    correo: string | null
}

// (Este es el gancho principal que exportamos y que las pantallas van a usar para hacer magia)
export function useAdminAdministradores() {
    // (Arreglo principal donde guardamos todos los admins que nos devuelve la base de datos)
    const [administradores, setAdministradores] = useState<Administrador[]>([])
    // (Aquí guardamos al administrador que el usuario seleccionó para editarlo)
    const [adminSeleccionado, setAdminSeleccionado] = useState<Administrador | null>(null)

    // (Todos estos estados de aquí abajo son para controlar lo que el usuario escribe en los inputs del formulario)
    const [usuario, setUsuario] = useState('')
    const [cedula, setCedula] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')
    // (La contraseña solo la pedimos cuando creamos a alguien nuevo)
    const [password, setPassword] = useState('')
    const [estado, setEstado] = useState<EstadoPerfil>('activo')

    // (Este estado nos sirve para mostrar un spinner mientras cargamos la lista gigante de admins)
    const [loadingData, setLoadingData] = useState(true)
    // (Y este es para poner un spinner solo en el botón de guardar o editar para que no le den doble clic)
    const [loadingAction, setLoadingAction] = useState(false)

    // (Esta es la función estrella que va a la base de datos y se trae a todos los administradores)
    const cargarAdministradores = useCallback(async () => {
        // (Intentamos hacer la petición y nos preparamos por si algo explota)
        try {
            // (Prendemos la ruedita de carga para que el usuario sepa que estamos pensando)
            setLoadingData(true)

            // (Llamamos a nuestro servicio para que nos traiga solo a los que tienen rol de admin)
            const { data, error } = await AdminService.obtenerUsuariosPorRol('admin')

            // (Si hubo un error en la base de datos nos detenemos y avisamos)
            if (error) {
                // (Imprimimos el error técnico en la consola para nosotros los desarrolladores)
                console.log(error.message)
                // (Le mostramos un modal bonito al usuario diciendo que falló)
                CustomAlert.alert('Error', 'No se pudieron cargar los administradores')
                return
            }

            // (Si todo salió bien guardamos los datos en nuestro estado y si viene nulo le ponemos un arreglo vacío)
            setAdministradores((data || []) as Administrador[])
        } catch (error) {
            // (Si el internet se cae o hay un error rarísimo atrapamos el problema aquí)
            console.log(error)
            // (Avisamos amigablemente)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar administradores')
        } finally {
            // (Pase lo que pase apagamos la ruedita de carga)
            setLoadingData(false)
        }
    }, [])

    // (Apenas se monte la pantalla le decimos a React que cargue la tabla de inmediato)
    useEffect(() => {
        cargarAdministradores()
    }, [cargarAdministradores])

    // (Esta función sirve para cuando haces clic en el botón de editar de la tabla)
    // (Toma al admin y rellena todo el formulario automáticamente)
    function seleccionarAdmin(admin: Administrador) {
        // (Guardamos quién es el elegido)
        setAdminSeleccionado(admin)
        // (Y empezamos a llenar los cuadritos de texto uno por uno)
        setUsuario(admin.usuario || '')
        setCedula(admin.cedula || '')
        setNombre(admin.nombre || '')
        setApellido(admin.apellido || '')
        setTelefono(admin.telefono || '')
        setCorreo(admin.correo || '')
        setEstado(admin.estado || 'activo')
        // (La contraseña siempre la vaciamos por seguridad porque no podemos verla)
        setPassword('')
    }

    // (Esta función sirve para borrar todo lo que escribiste en el formulario y dejarlo como nuevo)
    function limpiarFormulario() {
        // (Soltamos al administrador que teníamos seleccionado)
        setAdminSeleccionado(null)
        // (Vaciamos cada uno de los textos)
        setUsuario('')
        setCedula('')
        setNombre('')
        setApellido('')
        setTelefono('')
        setCorreo('')
        setPassword('')
        // (Y regresamos el estado a activo por defecto)
        setEstado('activo')
    }

    // (Esta función gigante es la que decide si vamos a crear un administrador nuevo o si vamos a editar uno que ya existe)
    async function guardarAdministrador() {
        // (Primero verificamos que no nos dejen el usuario vacío)
        if (!usuario.trim()) {
            CustomAlert.alert('Error de Validación', 'El usuario es obligatorio')
            return
        }
        // (Verificamos el nombre)
        if (!nombre.trim()) {
            CustomAlert.alert('Error de Validación', 'El nombre es obligatorio')
            return
        }
        // (Verificamos el apellido)
        if (!apellido.trim()) {
            CustomAlert.alert('Error de Validación', 'El apellido es obligatorio')
            return
        }
        // (Verificamos que hayan escrito algo en el correo)
        if (!correo.trim()) {
            CustomAlert.alert('Error de Validación', 'El correo es obligatorio')
            return
        }
        // (Revisamos que el correo tenga arroba y dominio usando nuestro regex)
        if (!validarCorreo(correo)) {
            CustomAlert.alert('Error de Validación', 'El correo electrónico no tiene un formato válido')
            return
        }
        // (Si pusieron cédula revisamos que tenga exactamente 10 números)
        if (cedula.trim() && !validarCedula(cedula)) {
            CustomAlert.alert('Error de Validación', 'La cédula debe tener exactamente 10 números numéricos')
            return
        }
        // (Si pusieron teléfono revisamos que tenga exactamente 10 números)
        if (telefono.trim() && !validarTelefono(telefono)) {
            CustomAlert.alert('Error de Validación', 'El teléfono debe tener exactamente 10 números numéricos')
            return
        }

        // (Si pasamos todas las barreras de seguridad intentamos guardar en la base de datos)
        try {
            // (Prendemos la ruedita del botón guardar para que no le den mil clics)
            setLoadingAction(true)

            // (Armamos el paquete de datos limpio que vamos a mandar a Supabase)
            const datos = {
                usuario: usuario.trim(),
                cedula: cedula.trim() || null,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || null,
                correo: correo.trim(),
                estado,
                // (Le forzamos el rol de admin para que nadie haga trampa)
                rol: 'admin',
                gasolinera_id: null,
            }

            // (Si ya teníamos un administrador seleccionado significa que estamos actualizando)
            if (adminSeleccionado) {
                // (Le decimos a Supabase que actualice a este usuario en específico con los datos nuevos)
                const { error } = await AdminService.actualizarUsuario(adminSeleccionado.id, datos)

                // (Si Supabase se enoja mostramos el error)
                if (error) {
                    console.log(error.message)
                    CustomAlert.alert('Error', 'No se pudo actualizar el administrador')
                    return
                }

                // (Avisamos que todo salió perfecto)
                CustomAlert.alert('Administrador actualizado', 'Los datos fueron guardados correctamente')
            } else {
                // (Si no había nadie seleccionado significa que es alguien nuevecito y necesitamos revisar su clave)
                if (!password.trim() || password.length < 6) {
                    CustomAlert.alert('Clave inválida', 'Asigna una contraseña de al menos 6 caracteres')
                    // (Apagamos la ruedita del botón porque nos detuvimos)
                    setLoadingAction(false)
                    return
                }

                // (Mandamos a crear el usuario en Supabase con su correo clave y paquete de datos)
                const { data, error } = await AdminService.crearUsuario(correo.trim(), password.trim(), datos)

                // (Si Supabase nos rebota la creación mostramos por qué)
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

                // (Celebramos que tenemos un nuevo integrante)
                CustomAlert.alert('Admin creado', 'El nuevo administrador fue registrado en el sistema')
            }

            // (Pase lo que pase limpiamos el formulario para que quede bonito)
            limpiarFormulario()
            // (Le damos un respiro de 1 segundo a la base de datos para que el trigger termine de crear el perfil antes de buscarlo)
            await new Promise(resolve => setTimeout(resolve, 1000))
            // (Y actualizamos la tabla para que aparezcan los cambios al instante)
            await cargarAdministradores()
        } catch (error) {
            // (Atrapamos errores catastróficos que rompan la promesa)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al guardar el administrador')
        } finally {
            // (Apagamos la ruedita del botón pase lo que pase)
            setLoadingAction(false)
        }
    }

    // (Esta pequeña función sirve para apagar o prender el acceso de un administrador con un solo botón)
    async function cambiarEstadoAdmin(id: string, nuevoEstado: EstadoPerfil) {
        // (Intentamos hacer el cambio)
        try {
            // (Ponemos el botón en modo carga)
            setLoadingAction(true)

            // (Le decimos a Supabase que le cambie el estado a este admin en específico)
            const { error } = await AdminService.cambiarEstadoUsuario(id, nuevoEstado)

            // (Si falla detenemos todo y avisamos)
            if (error) {
                console.log(error.message)
                CustomAlert.alert('Error', 'No se pudo cambiar el estado')
                return
            }

            // (Refrescamos la tabla para que veas el nuevo estado reflejado)
            await cargarAdministradores()
        } catch (error) {
            // (Por si acaso se nos va el internet en pleno cambio)
            console.log(error)
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema')
        } finally {
            // (Apagamos la ruedita del botón)
            setLoadingAction(false)
        }
    }

    // (Finalmente exportamos todas estas herramientas para que las pantallas puedan usarlas a su antojo)
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
