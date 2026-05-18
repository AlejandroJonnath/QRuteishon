// Importamos los componentes visuales de React Native que necesitamos para construir la pantalla
import {
    View,
    Text,
    TouchableOpacity,  // (Botones con efecto de opacidad al presionar)
    ActivityIndicator, // (Ruedita giratoria de carga)
    ScrollView,        // (Contenedor desplazable verticalmente)
    RefreshControl,    // (Permite recargar la lista jalando hacia abajo)
    TextInput,         // (Campos de texto para el formulario)
    Modal,             // (Ventana emergente que se superpone a la pantalla)
    KeyboardAvoidingView, // (Sube el contenido para que el teclado no tape los campos)
    Platform,          // (Detecta el sistema operativo)
} from 'react-native';
// Importamos React y useState para manejar estados locales de paginación y modal
import React, { useState } from 'react';
// Importamos el router para poder volver al panel principal
import { router } from 'expo-router';
// Importamos el guardián de seguridad de rutas
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook con toda la lógica de CRUD para administradores
import { useAdminAdministradores } from '../../hooks/AdminHooks/useAdminAdministradores';
// Importamos los estilos globales del módulo de administración
import { styles } from '../_styles/AdminStyles';

// Sección
// Este archivo es la pantalla donde un superadministrador puede gestionar
// a otros administradores del sistema (crearlos, editarlos, activarlos o inactivarlos)
// Usa el mismo patrón de modal que las otras pantallas del módulo admin:
// la lista está siempre visible y al tocar una fila o el botón de crear, se abre el formulario en un modal

// Funciones
// AdminAdministradores: Componente principal que renderiza la lista paginada y el modal del formulario
// abrirFormularioNuevo: Limpia el formulario y abre el modal en modo creación de admin
// abrirFormularioEditar: Carga los datos de un admin existente en el formulario y abre el modal
// cerrarModal: Limpia el formulario y cierra el modal sin guardar nada
// guardarYCerrar: Espera que el hook guarde al admin y luego cierra el modal

export default function AdminAdministradores() {
    // (Verificamos que quien entra tenga rol de admin, si no lo redirige al login)
    useRequireRole('admin');

    // (Desestructuramos todas las variables y funciones del hook de administradores)
    const {
        administradores,       // (Lista completa de todos los admins traídos de la base de datos)
        adminSeleccionado,     // (El admin que se está editando, null si es creación nueva)
        usuario,               // (Valor del campo "usuario" en el formulario)
        setUsuario,            // (Actualiza el campo "usuario")
        cedula,                // (Valor del campo "cédula")
        setCedula,             // (Actualiza el campo "cédula")
        nombre,                // (Valor del campo "nombre")
        setNombre,             // (Actualiza el campo "nombre")
        apellido,              // (Valor del campo "apellido")
        setApellido,           // (Actualiza el campo "apellido")
        telefono,              // (Valor del campo "teléfono")
        setTelefono,           // (Actualiza el campo "teléfono")
        correo,                // (Valor del campo "correo")
        setCorreo,             // (Actualiza el campo "correo")
        password,              // (Valor del campo "contraseña", solo visible al crear)
        setPassword,           // (Actualiza el campo "contraseña")
        estado,                // (Estado actual en el formulario: 'activo' o 'inactivo')
        setEstado,             // (Cambia el estado en el formulario)
        loadingData,           // (Verdadero mientras se descargan los admins de Supabase)
        loadingAction,         // (Verdadero mientras se procesa un guardado o cambio de estado)
        cargarAdministradores, // (Recarga la lista desde Supabase)
        seleccionarAdmin,      // (Carga los datos de un admin en el formulario para editar)
        limpiarFormulario,     // (Resetea todos los campos del formulario a vacío)
        guardarAdministrador,  // (Crea o edita un administrador según el contexto)
        cambiarEstadoAdmin,    // (Cambia el estado de un admin directamente)
    } = useAdminAdministradores();

    // (Estado local que controla en qué página de la lista estamos, empieza en 1)
    const [paginaActual, setPaginaActual] = useState(1);
    // (Estado local que controla si el modal del formulario está abierto o no)
    const [modalFormVisible, setModalFormVisible] = useState(false);
    // (Número fijo de registros por página)
    const registrosPorPagina = 5;

    // (Total de páginas = total de admins dividido entre 5, redondeando hacia arriba)
    // (Si no hay admins, usamos 1 para no mostrar "Página 1 de 0")
    const totalPaginas = Math.ceil(administradores.length / registrosPorPagina) || 1;
    // (Índice del último admin en la página actual)
    const indiceUltimo = paginaActual * registrosPorPagina;
    // (Índice del primer admin en la página actual)
    const indicePrimero = indiceUltimo - registrosPorPagina;
    // (Subconjunto del array total que contiene solo los admins de la página actual)
    const administradoresPaginados = administradores.slice(indicePrimero, indiceUltimo);

    // (Limpia cualquier dato previo en el formulario antes de abrir el modal para creación)
    function abrirFormularioNuevo() {
        limpiarFormulario();
        setModalFormVisible(true);
    }

    // (Recibe el objeto del admin tocado, lo carga en el formulario y abre el modal para edición)
    function abrirFormularioEditar(admin: Parameters<typeof seleccionarAdmin>[0]) {
        seleccionarAdmin(admin);
        setModalFormVisible(true);
    }

    // (Limpia el formulario y cierra el modal sin guardar ningún cambio)
    function cerrarModal() {
        limpiarFormulario();
        setModalFormVisible(false);
    }

    // (Espera que guardarAdministrador procese la operación y luego cierra el modal)
    async function guardarYCerrar() {
        await guardarAdministrador();
        setModalFormVisible(false);
    }

    // (Si los datos todavía se están cargando, mostramos la pantalla de espera)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando administradores...</Text>
            </View>
        );
    }

    return (
        // (Pantalla desplazable con soporte de actualización jalando hacia abajo)
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarAdministradores}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* Encabezado con el título y la descripción de la sección */}
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de Admins</Text>
                <Text style={styles.subtitle}>
                    Añade o revoca accesos de administrador al panel de control principal.
                </Text>
            </View>

            {/* Botón para abrir el modal y crear un administrador nuevo */}
            <TouchableOpacity style={styles.createButton} onPress={abrirFormularioNuevo}>
                <Text style={styles.createButtonText}>+ Crear administrador</Text>
            </TouchableOpacity>

            {/* Tarjeta que contiene la lista paginada de administradores */}
            <View style={styles.card}>
                {/* Encabezado de la tarjeta con el título y el conteo de admins */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Admins registrados</Text>
                    {/* (Número total de admins registrados en la base de datos) */}
                    <Text style={styles.cardMuted}>{administradores.length}</Text>
                </View>

                {/* (Si la lista está vacía, mostramos un mensaje indicándolo) */}
                {administradores.length === 0 ? (
                    <Text style={styles.emptyText}>No hay administradores registrados.</Text>
                ) : (
                    // (Si hay admins, mostramos la lista paginada y los controles)
                    <>
                        {/* (Recorremos solo los admins de la página actual) */}
                        {administradoresPaginados.map((admin) => (
                            // (Cada fila es un botón que abre el formulario de edición)
                            <TouchableOpacity
                                key={admin.id}
                                style={styles.listItem}
                                onPress={() => abrirFormularioEditar(admin)}
                                activeOpacity={0.85}
                            >
                                {/* Columna izquierda con los datos del admin */}
                                <View style={{ flex: 1 }}>
                                    {/* (Nombre de usuario del admin, con respaldo si no tiene) */}
                                    <Text style={styles.listTitle}>{admin.usuario || 'Sin usuario'}</Text>
                                    {/* (Nombre y apellido combinados) */}
                                    <Text style={styles.listText}>
                                        {admin.nombre || 'Sin nombre'} {admin.apellido || ''}
                                    </Text>
                                    {/* (Correo del admin) */}
                                    <Text style={styles.listText}>{admin.correo || 'Sin correo'}</Text>
                                </View>

                                {/* Columna derecha con la etiqueta de estado y el indicador de edición */}
                                <View style={styles.listActions}>
                                    {/* (Badge de color verde si está activo o rojo si está inactivo) */}
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            admin.estado === 'activo'
                                                ? styles.statusActivo
                                                : styles.statusInactivo,
                                        ]}
                                    >
                                        {admin.estado}
                                    </Text>
                                    <Text style={styles.editText}>Editar</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {/* Controles de paginación: Anterior, número de página, Siguiente */}
                        <View style={styles.paginationContainer}>
                            {/* Botón "Anterior" deshabilitado cuando estamos en la primera página */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaActual === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>

                            {/* Indicador de página actual sobre el total */}
                            <Text style={styles.paginationText}>
                                Página {paginaActual} de {totalPaginas}
                            </Text>

                            {/* Botón "Siguiente" deshabilitado cuando estamos en la última página */}
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

            {/* Botón de navegación para regresar al panel principal del administrador */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>

            {/* Modal del formulario para crear o editar administradores */}
            <Modal
                // (El modal se muestra cuando la variable de estado es verdadera)
                visible={modalFormVisible}
                // (El fondo detrás del modal es semitransparente)
                transparent
                // (Animación de entrada desde abajo de la pantalla)
                animationType="slide"
                // (El botón de atrás de Android cierra el modal)
                onRequestClose={cerrarModal}
            >
                {/* (Evita que el teclado tape los inputs del formulario en iOS) */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* (Capa oscura de fondo, tocarla cierra el modal) */}
                    <TouchableOpacity
                        style={styles.formModalOverlay}
                        activeOpacity={1}
                        onPress={cerrarModal}
                    >
                        {/* (Contenedor blanco del formulario: el activeOpacity=1 evita que los toques adentro cierren el modal) */}
                        <TouchableOpacity activeOpacity={1} style={styles.formModalContainer}>
                            {/* Encabezado del modal con título dinámico y botón cancelar */}
                            <View style={styles.formModalHeader}>
                                {/* (El título dice "Editar" si hay admin seleccionado, o "Crear" si es nuevo) */}
                                <Text style={styles.formModalTitle}>
                                    {adminSeleccionado ? 'Editar administrador' : 'Crear administrador'}
                                </Text>
                                {/* Botón de texto para cancelar y cerrar el modal sin guardar */}
                                <TouchableOpacity onPress={cerrarModal}>
                                    <Text style={styles.formModalClose}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Cuerpo desplazable del formulario */}
                            <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled">
                                {/* Campo de nombre de usuario */}
                                <Text style={styles.label}>Usuario</Text>
                                <TextInput style={styles.input} value={usuario} onChangeText={setUsuario} placeholder="Usuario" placeholderTextColor="#6B7280" />

                                {/* Campo de cédula (solo números) */}
                                <Text style={styles.label}>Cédula</Text>
                                <TextInput style={styles.input} value={cedula} onChangeText={setCedula} placeholder="Cédula" placeholderTextColor="#6B7280" keyboardType="number-pad" />

                                {/* Campo de nombre */}
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#6B7280" />

                                {/* Campo de apellido */}
                                <Text style={styles.label}>Apellido</Text>
                                <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Apellido" placeholderTextColor="#6B7280" />

                                {/* Campo de teléfono (teclado de teléfono) */}
                                <Text style={styles.label}>Teléfono</Text>
                                <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="Teléfono" placeholderTextColor="#6B7280" keyboardType="phone-pad" />

                                {/* Campo de correo electrónico */}
                                <Text style={styles.label}>Correo</Text>
                                {/* (autoCapitalize none evita la capitalización automática en correos) */}
                                <TextInput style={styles.input} value={correo} onChangeText={setCorreo} placeholder="Correo" placeholderTextColor="#6B7280" keyboardType="email-address" autoCapitalize="none" />

                                {/* (Campo de contraseña: SOLO visible cuando se crea un admin nuevo, no en edición) */}
                                {!adminSeleccionado && (
                                    <>
                                        <Text style={styles.label}>Contraseña</Text>
                                        {/* (secureTextEntry oculta el texto con puntos) */}
                                        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#6B7280" secureTextEntry />
                                    </>
                                )}

                                {/* Selector de estado entre Activo e Inactivo */}
                                <Text style={styles.label}>Estado</Text>
                                <View style={styles.row}>
                                    {/* Botón Activo resaltado cuando estado es 'activo' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, estado === 'activo' && styles.optionButtonActive]}
                                        onPress={() => setEstado('activo')}
                                    >
                                        <Text style={[styles.optionText, estado === 'activo' && styles.optionTextActive]}>
                                            Activo
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Botón Inactivo resaltado cuando estado es 'inactivo' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, estado === 'inactivo' && styles.optionButtonActive]}
                                        onPress={() => setEstado('inactivo')}
                                    >
                                        <Text style={[styles.optionText, estado === 'inactivo' && styles.optionTextActive]}>
                                            Inactivo
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Botón principal para guardar los cambios o crear el nuevo admin */}
                                <TouchableOpacity
                                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                                    onPress={guardarYCerrar}
                                    disabled={loadingAction}
                                >
                                    {/* (Ruedita mientras guarda, texto del botón cuando está libre) */}
                                    {loadingAction ? (
                                        <ActivityIndicator color="#0B132B" />
                                    ) : (
                                        <Text style={styles.buttonText}>{adminSeleccionado ? 'Guardar cambios' : 'Crear admin'}</Text>
                                    )}
                                </TouchableOpacity>

                                {/* (Botón de cambio rápido de estado: SOLO aparece en modo edición) */}
                                {adminSeleccionado && (
                                    <TouchableOpacity
                                        style={styles.secondaryButtonFull}
                                        onPress={() =>
                                            cambiarEstadoAdmin(
                                                // (ID del admin seleccionado)
                                                adminSeleccionado.id,
                                                // (Pasa el estado opuesto al actual)
                                                adminSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
                                            )
                                        }
                                        disabled={loadingAction}
                                    >
                                        {/* (El texto del botón varía según si está activo o inactivo) */}
                                        <Text style={styles.secondaryButtonFullText}>
                                            {adminSeleccionado.estado === 'activo' ? 'Inactivar administrador' : 'Activar administrador'}
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
(si quitas AdminAdministradores la sección de gestión de admins desaparece y su ruta arrojará un error)
(si quitas useRequireRole cualquier usuario podrá entrar a esta pantalla sin importar su rol)
(si quitas abrirFormularioNuevo el botón de crear administrador no abrirá el modal)
(si quitas abrirFormularioEditar tocar un admin de la lista no abrirá su formulario de edición)
(si quitas cerrarModal el modal no podrá cerrarse por ningún medio disponible al usuario)
(si quitas guardarYCerrar el botón guardar no procesará el formulario ni cerrará el modal)
(si quitas cargarAdministradores la lista no se actualizará al jalar la pantalla hacia abajo)
(si quitas cambiarEstadoAdmin el botón de activar/inactivar dentro del modal quedará completamente roto)
*/
