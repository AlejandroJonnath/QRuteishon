// Importamos los componentes visuales de React Native para construir la pantalla
import {
    View,
    Text,
    TouchableOpacity,  // (Botones presionables con efecto de opacidad)
    ActivityIndicator, // (Ruedita de carga)
    ScrollView,        // (Contenedor desplazable)
    RefreshControl,    // (Control para jalar y recargar)
    TextInput,         // (Campos de texto del formulario)
    Modal,             // (Ventana emergente sobre la pantalla)
    KeyboardAvoidingView, // (Sube el contenido cuando aparece el teclado)
    Platform,          // (Detecta si es iOS o Android)
} from 'react-native';
// Importamos React y useState para el estado local de paginación y visibilidad del modal
import React, { useState } from 'react';
// Importamos el router para el botón de volver al panel
import { router } from 'expo-router';
// Importamos el guardián que asegura que solo admins entren aquí
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook que concentra toda la lógica de cupones del administrador
import { useAdminCupones } from '../../hooks/AdminHooks/useAdminCupones';
// Importamos los estilos globales del módulo de administración
import { styles } from '../_styles/AdminStyles';

// Sección
// Este archivo es la pantalla de gestión de cupones para el administrador
// A diferencia de las otras pantallas, los cupones no se crean uno por uno sino en lotes
// El admin define la configuración del lote (cuántos cupones, tipo de descuento, valor y días de validez)
// y el hook se encarga de generarlos todos automáticamente con códigos únicos
// Los cupones que existen se pueden anular pero no editar, porque son de un solo uso

// Funciones
// AdminCupones: Componente principal con la lista paginada de cupones y el modal generador
// generarYCerrar: Espera que el hook genere el lote completo de cupones y luego cierra el modal

export default function AdminCupones() {
    // (Verificamos que quien entra tenga el rol de admin)
    useRequireRole('admin');

    // (Desestructuramos todo lo que nos da el hook de cupones)
    const {
        cupones,            // (Lista completa de cupones traídos de la base de datos)
        cantidad,           // (Valor del campo "cantidad" del formulario, cuántos cupones generar)
        setCantidad,        // (Actualiza el campo "cantidad")
        tipoDescuento,      // (Tipo de descuento seleccionado: 'monto' o 'porcentaje')
        setTipoDescuento,   // (Cambia el tipo de descuento)
        valorDescuento,     // (Valor del descuento que tendrán los cupones generados)
        setValorDescuento,  // (Actualiza el valor del descuento)
        diasValidez,        // (Cuántos días serán válidos los cupones desde que se creen)
        setDiasValidez,     // (Actualiza los días de validez)
        loadingData,        // (Verdadero mientras se descargan los cupones de Supabase)
        loadingAction,      // (Verdadero mientras se está generando el lote)
        cargarCupones,      // (Recarga la lista de cupones desde Supabase)
        generarLoteCupones, // (Función que crea todos los cupones en Supabase de una sola vez)
        cambiarEstadoCupon, // (Función para anular un cupón cambiando su estado a 'vencido')
    } = useAdminCupones();

    // (Estado local para la página actual de la lista de cupones)
    const [paginaActual, setPaginaActual] = useState(1);
    // (Estado local que controla si el modal del generador está abierto)
    const [modalFormVisible, setModalFormVisible] = useState(false);
    // (Número fijo de cupones por página)
    const registrosPorPagina = 5;

    // (Total de páginas redondeando hacia arriba, mínimo 1)
    const totalPaginas = Math.ceil(cupones.length / registrosPorPagina) || 1;
    // (Índice del último cupón de la página actual)
    const indiceUltimo = paginaActual * registrosPorPagina;
    // (Índice del primer cupón de la página actual)
    const indicePrimero = indiceUltimo - registrosPorPagina;
    // (Subconjunto del array total con solo los cupones de la página actual)
    const cuponesPaginados = cupones.slice(indicePrimero, indiceUltimo);

    // (Espera que el hook genere todos los cupones y luego cierra el modal)
    async function generarYCerrar() {
        await generarLoteCupones();
        setModalFormVisible(false);
    }

    // (Si los datos todavía se están cargando, mostramos la pantalla de espera)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando cupones...</Text>
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
                    onRefresh={cargarCupones}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* Encabezado con el título y descripción de la sección */}
            <View style={styles.header}>
                <Text style={styles.title}>CRUD de Cupones</Text>
                <Text style={styles.subtitle}>
                    Crea múltiples cupones automáticamente y administra los existentes.
                </Text>
            </View>

            {/* Botón que abre directamente el modal generador de cupones */}
            {/* (A diferencia de otras secciones, aquí no hay función separada porque no hay formulario de edición) */}
            <TouchableOpacity style={styles.createButton} onPress={() => setModalFormVisible(true)}>
                <Text style={styles.createButtonText}>+ Generar lote de cupones</Text>
            </TouchableOpacity>

            {/* Tarjeta que contiene la lista paginada de cupones existentes */}
            <View style={styles.card}>
                {/* Encabezado de la tarjeta con el título y el conteo total */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Cupones Globales</Text>
                    {/* (Número total de cupones en la base de datos) */}
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {/* (Si no hay cupones, mostramos un mensaje de lista vacía) */}
                {cupones.length === 0 ? (
                    <Text style={styles.emptyText}>No hay cupones registrados.</Text>
                ) : (
                    // (Si hay cupones, mostramos la lista paginada)
                    <>
                        {/* (Recorremos solo los cupones de la página actual) */}
                        {cuponesPaginados.map((cupon) => (
                            // (Cada cupón es un View simple, no un botón, porque los cupones no se editan)
                            <View key={cupon.id} style={styles.listItem}>
                                {/* Columna izquierda con los datos del cupón */}
                                <View style={{ flex: 1 }}>
                                    {/* (El código único del cupón, generado automáticamente) */}
                                    <Text style={styles.listTitle}>{cupon.codigo}</Text>
                                    {/* (Muestra el tipo de descuento con el símbolo correcto: $ si es monto, % si es porcentaje) */}
                                    <Text style={styles.listText}>
                                        Descuento: {cupon.tipo_descuento === 'monto' ? '$' : ''}{cupon.valor_descuento}{cupon.tipo_descuento === 'porcentaje' ? '%' : ''}
                                    </Text>
                                    {/* (Indica si el cupón es de uso único o puede usarse varias veces) */}
                                    <Text style={styles.listText}>Uso único: {cupon.uso_unico ? 'Sí' : 'No'}</Text>
                                </View>

                                {/* Columna derecha con el badge de estado y el botón de anular */}
                                <View style={styles.listActions}>
                                    {/* (Badge de color según el estado: verde si disponible, rojo si está vencido o usado) */}
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            cupon.estado === 'disponible' ? styles.statusActivo : styles.statusInactivo,
                                        ]}
                                    >
                                        {/* (Texto del estado tal cual viene de la base de datos) */}
                                        {cupon.estado}
                                    </Text>

                                    {/* (El botón de anular SOLO aparece si el cupón está disponible) */}
                                    {/* (Un cupón ya vencido o usado no se puede anular dos veces) */}
                                    {cupon.estado === 'disponible' && (
                                        <TouchableOpacity
                                            // (Al presionar, cambia el estado del cupón a 'vencido') 
                                            onPress={() => cambiarEstadoCupon(cupon.id, 'vencido')}
                                            // (Bloqueamos el botón si hay una acción en proceso)
                                            disabled={loadingAction}
                                        >
                                            {/* (Texto rojo para indicar que es una acción destructiva) */}
                                            <Text style={[styles.editText, { color: '#EF4444' }]}>Anular</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                        {/* Controles de paginación */}
                        <View style={styles.paginationContainer}>
                            {/* Botón Anterior deshabilitado en la primera página */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaActual === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                disabled={paginaActual === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>

                            {/* Indicador de página actual sobre total de páginas */}
                            <Text style={styles.paginationText}>
                                Página {paginaActual} de {totalPaginas}
                            </Text>

                            {/* Botón Siguiente deshabilitado en la última página */}
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

            {/* Modal del generador automático de cupones */}
            <Modal
                visible={modalFormVisible}
                transparent
                animationType="slide"
                // (En Android el botón de atrás cierra el modal)
                onRequestClose={() => setModalFormVisible(false)}
            >
                {/* (En iOS sube el contenido si el teclado tapa los campos) */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* (Capa oscura de fondo, tocarla cierra el modal) */}
                    <TouchableOpacity
                        style={styles.formModalOverlay}
                        activeOpacity={1}
                        onPress={() => setModalFormVisible(false)}
                    >
                        {/* (Contenedor del formulario: activeOpacity=1 evita que los toques dentro lo cierren) */}
                        <TouchableOpacity activeOpacity={1} style={styles.formModalContainer}>
                            {/* Encabezado del modal con título y botón cancelar */}
                            <View style={styles.formModalHeader}>
                                <Text style={styles.formModalTitle}>Generador Automático</Text>
                                {/* Botón de texto para cerrar sin generar nada */}
                                <TouchableOpacity onPress={() => setModalFormVisible(false)}>
                                    <Text style={styles.formModalClose}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Cuerpo desplazable con los campos del generador */}
                            <ScrollView style={styles.formModalBody} keyboardShouldPersistTaps="handled">
                                {/* Campo para definir cuántos cupones se van a generar en el lote */}
                                <Text style={styles.label}>Cantidad a generar (Ej: 10)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={cantidad}
                                    onChangeText={setCantidad}
                                    placeholder="Número de cupones"
                                    placeholderTextColor="#6B7280"
                                    // (Teclado solo de números porque no pueden generarse 2.5 cupones)
                                    keyboardType="number-pad"
                                />

                                {/* Selector del tipo de descuento: Monto Fijo o Porcentaje */}
                                <Text style={styles.label}>Tipo de Descuento</Text>
                                <View style={styles.row}>
                                    {/* Botón "Monto Fijo" resaltado cuando tipoDescuento es 'monto' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, tipoDescuento === 'monto' && styles.optionButtonActive]}
                                        onPress={() => setTipoDescuento('monto')}
                                    >
                                        <Text style={[styles.optionText, tipoDescuento === 'monto' && styles.optionTextActive]}>
                                            Monto Fijo ($)
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Botón "Porcentaje" resaltado cuando tipoDescuento es 'porcentaje' */}
                                    <TouchableOpacity
                                        style={[styles.optionButton, tipoDescuento === 'porcentaje' && styles.optionButtonActive]}
                                        onPress={() => setTipoDescuento('porcentaje')}
                                    >
                                        <Text style={[styles.optionText, tipoDescuento === 'porcentaje' && styles.optionTextActive]}>
                                            Porcentaje (%)
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Campo para el valor numérico del descuento */}
                                <Text style={styles.label}>Valor del Descuento</Text>
                                <TextInput
                                    style={styles.input}
                                    value={valorDescuento}
                                    onChangeText={setValorDescuento}
                                    placeholder="Ejemplo: 5"
                                    placeholderTextColor="#6B7280"
                                    // (Teclado numérico con punto decimal para valores como 5.50)
                                    keyboardType="numeric"
                                />

                                {/* Campo para definir cuántos días serán válidos los cupones generados */}
                                <Text style={styles.label}>Días de Validez</Text>
                                <TextInput
                                    style={styles.input}
                                    value={diasValidez}
                                    onChangeText={setDiasValidez}
                                    placeholder="Ejemplo: 30"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="number-pad"
                                />

                                {/* Botón principal para disparar la generación del lote */}
                                <TouchableOpacity
                                    // (Se vuelve opaco si ya hay una acción en proceso)
                                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                                    onPress={generarYCerrar}
                                    disabled={loadingAction}
                                >
                                    {/* (Ruedita mientras genera, texto cuando está libre) */}
                                    {loadingAction ? (
                                        <ActivityIndicator color="#0B132B" />
                                    ) : (
                                        <Text style={styles.buttonText}>Generar Lote Mágico</Text>
                                    )}
                                </TouchableOpacity>
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
(si quitas AdminCupones la sección de cupones del administrador desaparece y su ruta arrojará un error)
(si quitas useRequireRole cualquier usuario sin rol de admin podría entrar a generar y anular cupones)
(si quitas generarYCerrar el botón "Generar Lote Mágico" no hará nada al presionarse)
(si quitas generarLoteCupones no habrá ninguna manera de crear cupones desde el administrador)
(si quitas cambiarEstadoCupon el botón de anular cupones en la lista quedará completamente roto)
(si quitas cargarCupones la lista de cupones no se actualizará al jalar la pantalla hacia abajo)
*/
