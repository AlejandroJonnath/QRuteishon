// Importamos los componentes visuales de React Native que necesitamos para esta pantalla
import {
    View,
    Text,
    TouchableOpacity,  // (Botones que se vuelven opacos al presionar)
    ActivityIndicator, // (Ruedita giratoria de carga)
    ScrollView,        // (Contenedor que permite desplazar el contenido)
    RefreshControl,    // (Permite recargar la lista jalando la pantalla hacia abajo)
    TextInput,         // (Cajitas de texto para el formulario)
    Modal,             // (Ventana emergente que se superpone sobre la pantalla)
    KeyboardAvoidingView, // (Empuja la pantalla hacia arriba cuando aparece el teclado)
    Platform,          // (Detecta el sistema operativo para comportarse diferente en iOS y Android)
} from 'react-native';
// Importamos React y el hook useState para manejar el estado local de paginación y visibilidad del modal
import React, { useState } from 'react';
// Importamos el router para la navegación, en especial para el botón de volver
import { router } from 'expo-router';
// Importamos el guardián que bloquea el acceso a usuarios sin rol de admin
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook que contiene toda la lógica de clientes (cargar, crear, editar, cambiar estado)
import { useAdminClientes } from '../../hooks/AdminHooks/useAdminClientes';
// Importamos los estilos globales del módulo de administración
import { styles } from '../_styles/AdminStyles';

// Sección
// Este archivo es la pantalla de gestión completa de clientes para el administrador
// Permite ver la lista de todos los clientes registrados con paginación de 5 en 5
// Al tocar un cliente abre un modal con su formulario para editarlo
// También tiene un botón para crear un cliente completamente nuevo desde el mismo modal
// El formulario del modal incluye todos los campos del perfil y el toggle de estado activo/inactivo

// Funciones
// AdminClientes: Componente principal que renderiza la lista paginada y el modal del formulario
// abrirFormularioNuevo: Limpia el formulario y abre el modal en modo creación
// abrirFormularioEditar: Carga los datos de un cliente existente en el formulario y abre el modal
// cerrarModal: Limpia el formulario y cierra el modal sin guardar nada
// guardarYCerrar: Espera a que el hook guarde el cliente y luego cierra el modal

export default function AdminClientes() {
    // (Verificamos que el usuario logueado tenga el rol de admin, si no lo manda al login)
    useRequireRole('admin');

    // (Desestructuramos todo lo que nos da el hook de clientes)
    const {
        clientes,              // (Lista completa de todos los clientes traídos de Supabase)
        clienteSeleccionado,   // (El cliente que se está editando actualmente, null si es creación)
        usuario,               // (Valor del campo de texto "usuario" del formulario)
        setUsuario,            // (Función para actualizar el campo "usuario")
        cedula,                // (Valor del campo "cédula")
        setCedula,             // (Función para actualizar "cédula")
        nombre,                // (Valor del campo "nombre")
        setNombre,             // (Función para actualizar "nombre")
        apellido,              // (Valor del campo "apellido")
        setApellido,           // (Función para actualizar "apellido")
        telefono,              // (Valor del campo "teléfono")
        setTelefono,           // (Función para actualizar "teléfono")
        correo,                // (Valor del campo "correo")
        setCorreo,             // (Función para actualizar "correo")
        password,              // (Valor del campo "contraseña", solo se usa al crear)
        setPassword,           // (Función para actualizar "contraseña")
        estado,                // (Valor del campo "estado", puede ser 'activo' o 'inactivo')
        setEstado,             // (Función para cambiar el estado en el formulario)
        loadingData,           // (Verdadero mientras se están descargando los clientes de Supabase)
        loadingAction,         // (Verdadero mientras se está guardando o cambiando el estado)
        cargarClientes,        // (Función que recarga la lista de clientes desde Supabase)
        seleccionarCliente,    // (Función que pone los datos de un cliente en los campos del formulario)
        limpiarFormulario,     // (Función que pone todos los campos del formulario en blanco)
        guardarCliente,        // (Función que crea o edita un cliente en Supabase según el contexto)
        cambiarEstadoCliente,  // (Función que activa o inactiva un cliente directamente)
    } = useAdminClientes();

    // (Estado local para controlar en qué página de la lista estamos)
    const [paginaActual, setPaginaActual] = useState(1);
    // (Estado local para controlar si el modal del formulario está abierto o cerrado)
    const [modalFormVisible, setModalFormVisible] = useState(false);
    // (Cuántos clientes mostramos por página, fijo en 5)
    const registrosPorPagina = 5;

    // (Calculamos el total de páginas dividiendo el total de clientes entre los que caben por página)
    // (El || 1 evita que salga 0 páginas cuando no hay ningún cliente)
    const totalPaginas = Math.ceil(clientes.length / registrosPorPagina) || 1;
    // (Calculamos el índice del último cliente que va en la página actual)
    const indiceUltimo = paginaActual * registrosPorPagina;
    // (Calculamos el índice del primer cliente de la página actual)
    const indicePrimero = indiceUltimo - registrosPorPagina;
    // (Recortamos el array completo de clientes para quedarnos solo con los de la página actual)
    const clientesPaginados = clientes.slice(indicePrimero, indiceUltimo);

    // (Primero limpiamos cualquier dato viejo del formulario para que no aparezcan datos de otro cliente)
    // (Luego abrimos el modal en modo "crear nuevo")
    function abrirFormularioNuevo() {
        limpiarFormulario();
        setModalFormVisible(true);
    }

    // (Recibe el objeto completo del cliente tocado en la lista)
    // (Llama a seleccionarCliente que rellena los campos del formulario con sus datos)
    // (Luego abre el modal en modo "editar")
    function abrirFormularioEditar(cliente: Parameters<typeof seleccionarCliente>[0]) {
        seleccionarCliente(cliente);
        setModalFormVisible(true);
    }

    // (Limpia el formulario para no dejar datos basura y cierra el modal)
    function cerrarModal() {
        limpiarFormulario();
        setModalFormVisible(false);
    }

    // (Espera que guardarCliente termine de hablar con Supabase)
    // (El hook ya maneja la limpieza interna si tuvo éxito)
    // (Luego cerramos el modal independientemente)
    async function guardarYCerrar() {
        await guardarCliente();
        // (guardarCliente ya llama limpiarFormulario internamente si tiene éxito,)
        // (así que sólo cerramos si no hay errores (el hook ya cierra el loading))
        setModalFormVisible(false);
    }

    // (Si los datos aún están cargando, mostramos la pantalla de espera en lugar de la lista)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando clientes...</Text>
            </View>
        );
    }

    return (
        // (Pantalla principal desplazable con soporte para actualizar jalando hacia abajo)
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    // (Muestra la animación mientras se actualizan los datos)
                    refreshing={loadingData}
                    // (Llama a cargarClientes cuando el usuario suelta el gesto de jalar hacia abajo)
                    onRefresh={cargarClientes}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* Encabezado informativo con título y descripción de la sección */}
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de clientes</Text>
                <Text style={styles.subtitle}>
                    Crea clientes nuevos, edita información, actívalos o inactívalos.
                </Text>
            </View>

            {/* Botón verde grande para abrir el modal y crear un cliente desde cero */}
            <TouchableOpacity style={styles.createButton} onPress={abrirFormularioNuevo}>
                <Text style={styles.createButtonText}>+ Crear nuevo cliente</Text>
            </TouchableOpacity>

            {/* Tarjeta que contiene la lista de clientes y la paginación */}
            <View style={styles.card}>
                {/* Encabezado de la tarjeta con el título y el conteo total de clientes */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Clientes registrados</Text>
                    {/* (Mostramos el número total de clientes como dato secundario) */}
                    <Text style={styles.cardMuted}>{clientes.length}</Text>
                </View>

                {/* (Si no hay clientes en la base de datos, mostramos un texto de lista vacía) */}
                {clientes.length === 0 ? (
                    <Text style={styles.emptyText}>No hay clientes registrados.</Text>
                ) : (
                    // (Si hay clientes, mostramos los de la página actual y los controles de paginación)
                    <>
                        {/* (Recorremos solo los clientes de la página actual y creamos una tarjeta por cada uno) */}
                        {clientesPaginados.map((cliente) => (
                            // (Cada fila es presionable para abrir el formulario de edición)
                            <TouchableOpacity
                                // (key es obligatorio en listas de React para identificar cada elemento)
                                key={cliente.id}
                                style={styles.listItem}
                                // (Enviamos el objeto completo del cliente a la función que abre el modal)
                                onPress={() => abrirFormularioEditar(cliente)}
                                activeOpacity={0.85}
                            >
                                {/* Columna izquierda con los datos principales del cliente */}
                                <View style={{ flex: 1 }}>
                                    {/* (Mostramos el nombre de usuario o un texto de respaldo si no tiene) */}
                                    <Text style={styles.listTitle}>{cliente.usuario || 'Sin usuario'}</Text>
                                    {/* (Nombre completo con apellido, también con respaldo si vienen vacíos) */}
                                    <Text style={styles.listText}>
                                        {cliente.nombre || 'Sin nombre'} {cliente.apellido || ''}
                                    </Text>
                                    {/* (Correo electrónico del cliente) */}
                                    <Text style={styles.listText}>{cliente.correo || 'Sin correo'}</Text>
                                </View>

                                {/* Columna derecha con el badge de estado y el texto de editar */}
                                <View style={styles.listActions}>
                                    {/* (Etiqueta de color que cambia de verde a rojo según si está activo o no) */}
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            // (Si el estado es 'activo' se aplica el estilo verde, si no el rojo)
                                            cliente.estado === 'activo'
                                                ? styles.statusActivo
                                                : styles.statusInactivo,
                                        ]}
                                    >
                                        {/* (Muestra el texto del estado tal cual viene de la base de datos) */}
                                        {cliente.estado}
                                    </Text>
                                    {/* (Texto indicativo de que se puede tocar para editar) */}
                                    <Text style={styles.editText}>Editar</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {/* Controles de paginación debajo de la lista */}
                        <View style={styles.paginationContainer}>
                            {/* Botón para ir a la página anterior */}
                            <TouchableOpacity
                                // (Si estamos en la primera página, le aplicamos el estilo opaco de deshabilitado)
                                style={[styles.paginationButton, paginaActual === 1 && styles.paginationButtonDisabled]}
                                // (Math.max asegura que nunca baje de 1)
                                onPress={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                // (Deshabilitamos el botón cuando estamos en la primera página)
                                disabled={paginaActual === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>

                            {/* Indicador del número de página actual sobre el total */}
                            <Text style={styles.paginationText}>
                                Página {paginaActual} de {totalPaginas}
                            </Text>

                            {/* Botón para ir a la página siguiente */}
                            <TouchableOpacity
                                // (Si estamos en la última página, se aplica el estilo opaco de deshabilitado)
                                style={[styles.paginationButton, paginaActual === totalPaginas && styles.paginationButtonDisabled]}
                                // (Math.min asegura que nunca pase del total de páginas)
                                onPress={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                            >
                                <Text style={styles.paginationButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Botón para volver al panel principal del administrador */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>

            {/* Modal del formulario que aparece encima de la pantalla al crear o editar un cliente */}
            <Modal
                // (El modal es visible cuando modalFormVisible es verdadero)
                visible={modalFormVisible}
                // (transparent hace que el fondo detrás del modal sea semi-transparente)
                transparent
                // (Animación de deslizamiento desde abajo cuando aparece)
                animationType="slide"
                // (En Android, al presionar el botón físico de atrás, cierra el modal)
                onRequestClose={cerrarModal}
            >
                {/* (En iOS empuja el contenido para que el teclado no tape los campos de abajo) */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* (Capa oscura semitransparente de fondo que al tocarse cierra el modal) */}
                    <TouchableOpacity
                        style={styles.formModalOverlay}
                        activeOpacity={1}
                        onPress={cerrarModal}
                    >
                        {/* (Contenedor blanco del formulario: el activeOpacity=1 evita que los toques dentro cierren el modal) */}
                        <TouchableOpacity activeOpacity={1} style={styles.formModalContainer}>
                            {/* Encabezado del modal con el título dinámico y el botón de cancelar */}
                            <View style={styles.formModalHeader}>
                                {/* (El título cambia según si hay un cliente seleccionado o si es uno nuevo) */}
                                <Text style={styles.formModalTitle}>
                                    {clienteSeleccionado ? 'Editar cliente' : 'Crear nuevo cliente'}
                                </Text>
                                {/* Botón de texto "Cancelar" que cierra el modal sin guardar */}
                                <TouchableOpacity onPress={cerrarModal}>
                                    <Text style={styles.formModalClose}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Cuerpo desplazable del formulario para que quepan todos los campos en pantallas pequeñas */}
                            <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled">
                                {/* Campo de texto para el nombre de usuario */}
                                <Text style={styles.label}>Usuario</Text>
                                <TextInput style={styles.input} value={usuario} onChangeText={setUsuario} placeholder="Usuario" placeholderTextColor="#6B7280" />

                                {/* Campo de texto para la cédula (teclado numérico) */}
                                <Text style={styles.label}>Cédula</Text>
                                <TextInput style={styles.input} value={cedula} onChangeText={setCedula} placeholder="Cédula" placeholderTextColor="#6B7280" keyboardType="number-pad" />

                                {/* Campo de texto para el nombre */}
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#6B7280" />

                                {/* Campo de texto para el apellido */}
                                <Text style={styles.label}>Apellido</Text>
                                <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Apellido" placeholderTextColor="#6B7280" />

                                {/* Campo de texto para el teléfono (teclado de teléfono) */}
                                <Text style={styles.label}>Teléfono</Text>
                                <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" />

                                {/* Campo de texto para el correo electrónico */}
                                <Text style={styles.label}>Correo</Text>
                                {/* (keyboardType email-address abre el teclado con @ disponible) */}
                                {/* (autoCapitalize none evita que capitalice la primera letra) */}
                                <TextInput style={styles.input} value={correo} onChangeText={setCorreo} placeholder="Correo" placeholderTextColor="#6B7280" keyboardType="email-address" autoCapitalize="none" />

                                {/* (El campo de contraseña SOLO aparece cuando se está creando un cliente nuevo) */}
                                {/* (En edición no se muestra para no obligar a cambiar la clave) */}
                                {!clienteSeleccionado && (
                                    <>
                                        <Text style={styles.label}>Contraseña</Text>
                                        {/* (secureTextEntry oculta los caracteres con asteriscos) */}
                                        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#6B7280" secureTextEntry />
                                    </>
                                )}

                                {/* Selector de estado: dos botones que actúan como un toggle entre activo e inactivo */}
                                <Text style={styles.label}>Estado</Text>
                                <View style={styles.row}>
                                    {/* Botón "Activo": se resalta si estado === 'activo' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, estado === 'activo' && styles.optionButtonActive]}
                                        onPress={() => setEstado('activo')}
                                    >
                                        <Text style={[styles.optionText, estado === 'activo' && styles.optionTextActive]}>
                                            Activo
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Botón "Inactivo": se resalta si estado === 'inactivo' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, estado === 'inactivo' && styles.optionButtonActive]}
                                        onPress={() => setEstado('inactivo')}
                                    >
                                        <Text style={[styles.optionText, estado === 'inactivo' && styles.optionTextActive]}>
                                            Inactivo
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Botón principal para guardar el cliente (crea o edita según el contexto) */}
                                <TouchableOpacity
                                    // (Se vuelve opaco si loadingAction es verdadero para indicar que está procesando)
                                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                                    onPress={guardarYCerrar}
                                    // (Deshabilitamos el botón mientras se procesa para evitar doble envío)
                                    disabled={loadingAction}
                                >
                                    {/* (Mientras carga mostramos la ruedita, cuando termina mostramos el texto) */}
                                    {loadingAction ? (
                                        <ActivityIndicator color="#0B132B" />
                                    ) : (
                                        // (El texto del botón cambia según si es edición o creación)
                                        <Text style={styles.buttonText}>{clienteSeleccionado ? 'Guardar cambios' : 'Crear cliente'}</Text>
                                    )}
                                </TouchableOpacity>

                                {/* (Este botón secundario SOLO aparece cuando se está editando un cliente existente) */}
                                {/* (Sirve para cambiar el estado opuesto al actual con un solo toque) */}
                                {clienteSeleccionado && (
                                    <TouchableOpacity
                                        style={styles.secondaryButtonFull}
                                        onPress={() =>
                                            cambiarEstadoCliente(
                                                // (Pasamos el ID del cliente seleccionado)
                                                clienteSeleccionado.id,
                                                // (Si está activo lo pasamos a inactivo y viceversa)
                                                clienteSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
                                            )
                                        }
                                        disabled={loadingAction}
                                    >
                                        {/* (El texto del botón también cambia según el estado actual del cliente) */}
                                        <Text style={styles.secondaryButtonFullText}>
                                            {clienteSeleccionado.estado === 'activo' ? 'Inactivar cliente' : 'Activar cliente'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas AdminClientes la ruta de gestión de clientes arrojará un error y no cargará nada)
(si quitas useRequireRole cualquier persona podrá acceder a esta pantalla sin ser administrador)
(si quitas abrirFormularioNuevo el botón "Crear nuevo cliente" no hará nada al presionarlo)
(si quitas abrirFormularioEditar tocar cualquier cliente de la lista no abrirá el formulario de edición)
(si quitas cerrarModal el modal no podrá cerrarse con el botón Cancelar ni tocando el fondo oscuro)
(si quitas guardarYCerrar el botón de guardar no hará nada y nunca se cerrará el modal tras guardar)
(si quitas cargarClientes la lista nunca se actualizará al jalar hacia abajo y mostrará datos obsoletos)
(si quitas cambiarEstadoCliente el botón de activar/inactivar cliente dentro del modal quedará roto)
*/
