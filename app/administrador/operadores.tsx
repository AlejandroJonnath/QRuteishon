// Importamos los componentes visuales de React Native que necesitamos para esta pantalla
import {
    View,
    Text,
    TouchableOpacity,  // (Botones con efecto de opacidad)
    ActivityIndicator, // (Ruedita de carga giratoria)
    ScrollView,        // (Contenedor desplazable)
    RefreshControl,    // (Control para jalar y recargar)
    TextInput,         // (Cajitas de texto del formulario)
    Modal,             // (Ventana emergente sobre la pantalla)
    KeyboardAvoidingView, // (Empuja el contenido cuando aparece el teclado)
    Platform,          // (Detecta el sistema operativo iOS o Android)
} from 'react-native';
// Importamos React y useState para el estado local de paginación y del modal
import React, { useState } from 'react';
// Importamos el router para la navegación (botón de volver)
import { router } from 'expo-router';
// Importamos el guardián que bloquea el acceso a usuarios sin rol de admin
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook que tiene toda la lógica de operadores (cargar, crear, editar, cambiar estado)
import { useAdminOperadores } from '../../hooks/AdminHooks/useAdminOperadores';
// Importamos los estilos globales del módulo de administración
import { styles } from '../_styles/AdminStyles';

// Sección
// Este archivo es la pantalla más compleja del módulo de administración
// Permite gestionar los operadores (despachadores de gasolinera) del sistema
// Tiene dos modales en paralelo:
// - El modal principal del formulario donde se edita o crea el operador
// - Un modal secundario de selección de gasolinera que aparece desde el formulario principal
// La gasolinera es un campo obligatorio para los operadores porque define dónde trabajarán

// Funciones
// AdminOperadores: Componente principal con la lista paginada y los dos modales
// abrirFormularioNuevo: Limpia el formulario y abre el modal en modo creación
// abrirFormularioEditar: Carga los datos de un operador en el formulario y abre el modal
// cerrarModal: Limpia el formulario y cierra el modal principal sin guardar
// guardarYCerrar: Espera que el hook guarde el operador y cierra el modal principal

export default function AdminOperadores() {
    // (Verificamos que quien entra sea admin, si no lo redirige automáticamente)
    useRequireRole('admin');

    // (Estado local para controlar si el modal de selección de gasolinera está abierto)
    const [modalGasolineraVisible, setModalGasolineraVisible] = useState(false);
    // (Estado local para controlar si el modal del formulario de operador está abierto)
    const [modalFormVisible, setModalFormVisible] = useState(false);

    // (Desestructuramos todas las variables y funciones del hook de operadores)
    const {
        operadores,           // (Lista completa de operadores de la base de datos)
        gasolineras,          // (Lista de todas las gasolineras disponibles para asignar)
        operadorSeleccionado, // (El operador que se está editando, null si es creación)
        usuario,              // (Valor del campo "usuario" en el formulario)
        setUsuario,           // (Actualiza el campo "usuario")
        cedula,               // (Valor del campo "cédula")
        setCedula,            // (Actualiza el campo "cédula")
        nombre,               // (Valor del campo "nombre")
        setNombre,            // (Actualiza el campo "nombre")
        apellido,             // (Valor del campo "apellido")
        setApellido,          // (Actualiza el campo "apellido")
        telefono,             // (Valor del campo "teléfono")
        setTelefono,          // (Actualiza el campo "teléfono")
        correo,               // (Valor del campo "correo")
        setCorreo,            // (Actualiza el campo "correo")
        password,             // (Valor del campo "contraseña", solo en creación)
        setPassword,          // (Actualiza el campo "contraseña")
        gasolineraId,         // (ID de la gasolinera seleccionada para este operador)
        setGasolineraId,      // (Actualiza el ID de gasolinera cuando se elige una)
        estado,               // (Estado en el formulario: 'activo' o 'inactivo')
        setEstado,            // (Cambia el estado en el formulario)
        loadingData,          // (Verdadero mientras se descargan los operadores)
        loadingAction,        // (Verdadero mientras se procesa un guardado)
        cargarOperadores,     // (Recarga la lista de operadores desde Supabase)
        seleccionarOperador,  // (Carga los datos de un operador en el formulario)
        limpiarFormulario,    // (Resetea todos los campos del formulario)
        guardarOperador,      // (Crea o edita un operador según el contexto)
        cambiarEstadoOperador,// (Cambia el estado activo/inactivo de un operador)
    } = useAdminOperadores();

    // (Estado local para la página actual de la lista de operadores)
    const [paginaActual, setPaginaActual] = useState(1);
    // (Número fijo de operadores por página)
    const registrosPorPagina = 5;

    // (Total de páginas calculado redondeando hacia arriba)
    const totalPaginas = Math.ceil(operadores.length / registrosPorPagina) || 1;
    // (Índice del último operador en la página actual)
    const indiceUltimo = paginaActual * registrosPorPagina;
    // (Índice del primer operador en la página actual)
    const indicePrimero = indiceUltimo - registrosPorPagina;
    // (Slice del array completo para obtener solo los de la página actual)
    const operadoresPaginados = operadores.slice(indicePrimero, indiceUltimo);

    // (Limpia el formulario antes de abrir el modal para no mostrar datos viejos)
    function abrirFormularioNuevo() {
        limpiarFormulario();
        setModalFormVisible(true);
    }

    // (Carga los datos del operador tocado en el formulario y abre el modal)
    function abrirFormularioEditar(operador: Parameters<typeof seleccionarOperador>[0]) {
        seleccionarOperador(operador);
        setModalFormVisible(true);
    }

    // (Limpia el formulario y cierra el modal sin guardar)
    function cerrarModal() {
        limpiarFormulario();
        setModalFormVisible(false);
    }

    // (Espera que el hook procese el guardado y luego cierra el modal)
    async function guardarYCerrar() {
        await guardarOperador();
        setModalFormVisible(false);
    }

    // (Si todavía se están cargando los datos, mostramos la pantalla de espera)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando operadores...</Text>
            </View>
        );
    }

    return (
        // (Pantalla principal desplazable con soporte para jalar y actualizar)
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarOperadores}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* Encabezado con el título y descripción de la sección */}
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de operadores</Text>
                <Text style={styles.subtitle}>
                    Crea nuevos despachadores, asígnales una gasolinera o edita sus datos.
                </Text>
            </View>

            {/* Botón para abrir el modal y crear un operador nuevo */}
            <TouchableOpacity style={styles.createButton} onPress={abrirFormularioNuevo}>
                <Text style={styles.createButtonText}>+ Crear operador</Text>
            </TouchableOpacity>

            {/* Tarjeta que contiene la lista paginada de operadores */}
            <View style={styles.card}>
                {/* Encabezado de la tarjeta con título y conteo total de operadores */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Operadores registrados</Text>
                    {/* (Número total de operadores en la base de datos) */}
                    <Text style={styles.cardMuted}>{operadores.length}</Text>
                </View>

                {/* (Si no hay operadores, mostramos un mensaje de lista vacía) */}
                {operadores.length === 0 ? (
                    <Text style={styles.emptyText}>No hay operadores registrados.</Text>
                ) : (
                    // (Si hay operadores, mostramos la lista paginada y los controles)
                    <>
                        {/* (Recorremos solo los operadores de la página actual) */}
                        {operadoresPaginados.map((operador) => (
                            // (Cada fila es presionable para abrir el formulario de edición)
                            <TouchableOpacity
                                key={operador.id}
                                style={styles.listItem}
                                onPress={() => abrirFormularioEditar(operador)}
                                activeOpacity={0.85}
                            >
                                {/* Columna izquierda con los datos del operador */}
                                <View style={{ flex: 1 }}>
                                    {/* (Nombre de usuario con respaldo si viene vacío) */}
                                    <Text style={styles.listTitle}>{operador.usuario || 'Sin usuario'}</Text>
                                    {/* (Nombre completo del operador) */}
                                    <Text style={styles.listText}>
                                        {operador.nombre || 'Sin nombre'} {operador.apellido || ''}
                                    </Text>
                                    {/* (Correo electrónico del operador) */}
                                    <Text style={styles.listText}>{operador.correo || 'Sin correo'}</Text>
                                </View>

                                {/* Columna derecha con badge de estado y texto de editar */}
                                <View style={styles.listActions}>
                                    {/* (Badge verde para activo, rojo para inactivo) */}
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            operador.estado === 'activo'
                                                ? styles.statusActivo
                                                : styles.statusInactivo,
                                        ]}
                                    >
                                        {operador.estado}
                                    </Text>
                                    <Text style={styles.editText}>Editar</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {/* Controles de paginación: Anterior, página actual/total, Siguiente */}
                        <View style={styles.paginationContainer}>
                            {/* Botón Anterior: deshabilitado cuando estamos en la primera página */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaActual === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>

                            {/* Indicador de página actual sobre el total de páginas */}
                            <Text style={styles.paginationText}>
                                Página {paginaActual} de {totalPaginas}
                            </Text>

                            {/* Botón Siguiente: deshabilitado cuando estamos en la última página */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaActual === totalPaginas && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                disabled={paginaActual === totalPaginas}
                            >
                                <Text style={styles.paginationButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Botón para regresar al panel principal del administrador */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>

            {/* Modal principal del formulario para crear o editar operadores */}
            <Modal
                visible={modalFormVisible}
                transparent
                animationType="slide"
                // (El botón físico de atrás en Android cierra el modal)
                onRequestClose={cerrarModal}
            >
                {/* (En iOS evita que el teclado tape los inputs) */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* (Capa oscura de fondo: tocarla cierra el modal) */}
                    <TouchableOpacity
                        style={styles.formModalOverlay}
                        activeOpacity={1}
                        onPress={cerrarModal}
                    >
                        {/* (Contenedor blanco del formulario: activeOpacity=1 evita que toques adentro lo cierren) */}
                        <TouchableOpacity activeOpacity={1} style={styles.formModalContainer}>
                            {/* Encabezado del modal con título dinámico y botón cancelar */}
                            <View style={styles.formModalHeader}>
                                {/* (Título cambia entre "Editar" y "Crear" según el contexto) */}
                                <Text style={styles.formModalTitle}>
                                    {operadorSeleccionado ? 'Editar operador' : 'Crear operador'}
                                </Text>
                                {/* Botón de texto para cerrar sin guardar */}
                                <TouchableOpacity onPress={cerrarModal}>
                                    <Text style={styles.formModalClose}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Cuerpo desplazable con todos los campos del formulario */}
                            <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled">
                                {/* Campo de nombre de usuario */}
                                <Text style={styles.label}>Usuario</Text>
                                <TextInput style={styles.input} value={usuario} onChangeText={setUsuario} placeholder="Usuario" placeholderTextColor="#6B7280" />

                                {/* Campo de cédula con teclado numérico */}
                                <Text style={styles.label}>Cédula</Text>
                                <TextInput style={styles.input} value={cedula} onChangeText={setCedula} placeholder="Cédula" placeholderTextColor="#6B7280" keyboardType="number-pad" />

                                {/* Campo de nombre */}
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#6B7280" />

                                {/* Campo de apellido */}
                                <Text style={styles.label}>Apellido</Text>
                                <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Apellido" placeholderTextColor="#6B7280" />

                                {/* Campo de teléfono */}
                                <Text style={styles.label}>Teléfono</Text>
                                <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" />

                                {/* Campo de correo electrónico */}
                                <Text style={styles.label}>Correo</Text>
                                <TextInput style={styles.input} value={correo} onChangeText={setCorreo} placeholder="Correo" placeholderTextColor="#6B7280" keyboardType="email-address" autoCapitalize="none" />

                                {/* Campo especial de selección de gasolinera (es obligatorio para operadores) */}
                                <Text style={styles.label}>Gasolinera (Obligatorio)</Text>
                                {/* (Este campo no es un TextInput sino un botón que abre el segundo modal) */}
                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center' }]}
                                    // (Al presionarlo, abre el modal de lista de gasolineras)
                                    onPress={() => setModalGasolineraVisible(true)}
                                >
                                    {/* (Si ya hay una gasolinera seleccionada muestra su nombre en blanco, si no muestra el placeholder gris) */}
                                    <Text style={{ color: gasolineraId ? '#FFFFFF' : '#6B7280' }}>
                                        {gasolineras.find(g => g.id === gasolineraId)?.nombre || "Seleccionar Gasolinera"}
                                    </Text>
                                </TouchableOpacity>

                                {/* (Campo de contraseña: SOLO aparece cuando se está creando un operador nuevo) */}
                                {!operadorSeleccionado && (
                                    <>
                                        <Text style={styles.label}>Contraseña</Text>
                                        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#6B7280" secureTextEntry />
                                    </>
                                )}

                                {/* Selector de estado entre Activo e Inactivo */}
                                <Text style={styles.label}>Estado</Text>
                                <View style={styles.row}>
                                    {/* Botón Activo, se resalta si estado === 'activo' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, estado === 'activo' && styles.optionButtonActive]}
                                        onPress={() => setEstado('activo')}
                                    >
                                        <Text style={[styles.optionText, estado === 'activo' && styles.optionTextActive]}>
                                            Activo
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Botón Inactivo, se resalta si estado === 'inactivo' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, estado === 'inactivo' && styles.optionButtonActive]}
                                        onPress={() => setEstado('inactivo')}
                                    >
                                        <Text style={[styles.optionText, estado === 'inactivo' && styles.optionTextActive]}>
                                            Inactivo
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Botón principal de guardado */}
                                <TouchableOpacity
                                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                                    onPress={guardarYCerrar}
                                    disabled={loadingAction}
                                >
                                    {/* (Ruedita mientras procesa, texto cuando está libre) */}
                                    {loadingAction ? (
                                        <ActivityIndicator color="#0B132B" />
                                    ) : (
                                        // (Texto dinámico según si es edición o creación)
                                        <Text style={styles.buttonText}>{operadorSeleccionado ? 'Guardar cambios' : 'Crear operador'}</Text>
                                    )}
                                </TouchableOpacity>

                                {/* (Botón de cambio rápido de estado: SOLO aparece en modo edición) */}
                                {operadorSeleccionado && (
                                    <TouchableOpacity
                                        style={styles.secondaryButtonFull}
                                        onPress={() =>
                                            cambiarEstadoOperador(
                                                // (ID del operador seleccionado)
                                                operadorSeleccionado.id,
                                                // (Si está activo pasa a inactivo y viceversa)
                                                operadorSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
                                            )
                                        }
                                        disabled={loadingAction}
                                    >
                                        {/* (Texto que cambia según el estado actual del operador) */}
                                        <Text style={styles.secondaryButtonFullText}>
                                            {operadorSeleccionado.estado === 'activo' ? 'Inactivar operador' : 'Activar operador'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal secundario para seleccionar la gasolinera del operador */}
            {/* (Este modal se abre desde dentro del formulario, por eso es el segundo) */}
            <Modal
                visible={modalGasolineraVisible}
                transparent
                // (Animación más rápida de fundido en vez de deslizar para que se vea diferente al principal)
                animationType="fade"
                onRequestClose={() => setModalGasolineraVisible(false)}
            >
                {/* (Capa oscura de fondo que cierra este modal al tocarla) */}
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalGasolineraVisible(false)}
                >
                    {/* Contenedor blanco central con la lista de gasolineras */}
                    <View style={styles.modalContent}>
                        {/* Título del modal de selección */}
                        <Text style={styles.modalTitle}>Selecciona una Gasolinera</Text>
                        {/* Lista desplazable con altura máxima de 300 puntos para no ocupar toda la pantalla */}
                        <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                            {/* (Recorremos todas las gasolineras disponibles y creamos un botón por cada una) */}
                            {gasolineras.map(g => (
                                <TouchableOpacity
                                    key={g.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        // (Guardamos el ID de la gasolinera elegida en el estado del formulario)
                                        setGasolineraId(g.id);
                                        // (Cerramos este modal secundario para volver al formulario principal)
                                        setModalGasolineraVisible(false);
                                    }}
                                >
                                    {/* (Nombre de la gasolinera como texto del botón) */}
                                    <Text style={styles.modalItemText}>{g.nombre}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {/* Botón de cancelar para cerrar sin seleccionar ninguna gasolinera */}
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalGasolineraVisible(false)}>
                            <Text style={styles.modalCloseText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas AdminOperadores la sección de gestión de operadores deja de existir y su ruta arrojará un error)
(si quitas useRequireRole cualquier usuario sin importar su rol podría acceder y crear operadores)
(si quitas abrirFormularioNuevo el botón de crear operador no hará nada al presionarse)
(si quitas abrirFormularioEditar tocar un operador de la lista no abrirá el formulario de edición)
(si quitas cerrarModal el modal del formulario quedará atrapado sin poder cerrarse)
(si quitas guardarYCerrar el botón guardar no procesará el formulario ni cerrará el modal al terminar)
(si quitas el modal de gasolinera el operador no podrá asignarse a ninguna gasolinera y la creación fallará)
(si quitas cargarOperadores la lista no se actualizará cuando el usuario jale hacia abajo)
(si quitas cambiarEstadoOperador el botón de activar/inactivar dentro del modal quedará completamente roto)
*/
