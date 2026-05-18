// Importamos los componentes visuales de React Native que necesitamos para construir la pantalla
import {
    View,
    Text,
    ActivityIndicator, // (Ruedita giratoria de carga)
    ScrollView,        // (Contenedor desplazable)
    RefreshControl,    // (Control para jalar la pantalla y recargar)
    TouchableOpacity,  // (Botones presionables)
} from 'react-native';
// Importamos React y useState para manejar los estados locales de paginación (uno para pagos, otro para recargas)
import React, { useState } from 'react';
// Importamos los íconos para los recuadros de estadísticas
import { Ionicons } from '@expo/vector-icons';
// Importamos el router para el botón de volver al panel principal
import { router } from 'expo-router';
// Importamos el guardián que bloquea el acceso a usuarios sin rol de admin
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook que trae los datos de pagos, recargas e ingresos calculados
import { useAdminAnaliticas } from '../../hooks/AdminHooks/useAdminAnaliticas';
// Importamos los estilos globales del módulo de administración
import { styles } from '../_styles/AdminStyles';

// Sección
// Este archivo es la pantalla de analíticas y reportes del administrador
// Muestra dos grandes tarjetas de resumen con los ingresos totales por pagos QR y por recargas de billetera
// Debajo tiene dos listas paginadas independientes: una para los últimos pagos y otra para las últimas recargas
// Cada lista tiene su propio par de botones de paginación para navegar de forma independiente

// Funciones
// AdminAnaliticas: Componente principal que muestra el dashboard financiero del sistema con listas paginadas

export default function AdminAnaliticas() {
    // (Verificamos que quien entra tenga el rol de admin)
    useRequireRole('admin');

    // (Desestructuramos todo lo que nos da el hook de analíticas)
    const {
        pagos,            // (Lista de todos los pagos QR aprobados del sistema)
        recargas,         // (Lista de todas las recargas de billetera del sistema)
        ingresosPagos,    // (Suma total de dinero recaudado por pagos QR)
        ingresosRecargas, // (Suma total de dinero cargado en billeteras via recargas)
        loadingData,      // (Verdadero mientras se descargan los datos de Supabase)
        cargarAnaliticas, // (Función que recarga todos los datos del dashboard)
    } = useAdminAnaliticas();

    // (Estado local de paginación independiente para la tabla de pagos)
    const [paginaPagos, setPaginaPagos] = useState(1);
    // (Estado local de paginación independiente para la tabla de recargas)
    const [paginaRecargas, setPaginaRecargas] = useState(1);
    // (Número fijo de registros por página en ambas listas)
    const registrosPorPagina = 5;

    // (Total de páginas de la lista de pagos)
    const totalPaginasPagos = Math.ceil(pagos.length / registrosPorPagina) || 1;
    // (Índice del último pago en la página actual de pagos)
    const indiceUltimoPago = paginaPagos * registrosPorPagina;
    // (Índice del primer pago en la página actual de pagos)
    const indicePrimeroPago = indiceUltimoPago - registrosPorPagina;
    // (Subconjunto del array de pagos para la página actual)
    const pagosPaginados = pagos.slice(indicePrimeroPago, indiceUltimoPago);

    // (Total de páginas de la lista de recargas)
    const totalPaginasRecargas = Math.ceil(recargas.length / registrosPorPagina) || 1;
    // (Índice de la última recarga en la página actual de recargas)
    const indiceUltimaRecarga = paginaRecargas * registrosPorPagina;
    // (Índice de la primera recarga en la página actual de recargas)
    const indicePrimeraRecarga = indiceUltimaRecarga - registrosPorPagina;
    // (Subconjunto del array de recargas para la página actual)
    const recargasPaginadas = recargas.slice(indicePrimeraRecarga, indiceUltimaRecarga);

    // (Si los datos todavía se están cargando, mostramos la pantalla de espera)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Calculando ingresos...</Text>
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
                    onRefresh={cargarAnaliticas}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* Encabezado con el título y descripción de la sección */}
            <View style={styles.header}>
                <Text style={styles.title}>Analíticas y Reportes</Text>
                <Text style={styles.subtitle}>
                    Revisa el volumen de ventas y transacciones de las gasolineras.
                </Text>
            </View>

            {/* Tarjeta grande oscura que muestra los ingresos totales por pagos QR */}
            {/* (Esta es la tarjeta principal con fondo verde y texto oscuro) */}
            <View style={styles.bigStatCard}>
                <View>
                    {/* Etiqueta descriptiva del recuadro */}
                    <Text style={styles.bigStatLabel}>Ingresos por Pagos</Text>
                    {/* (toFixed(2) asegura que siempre se muestren dos decimales) */}
                    <Text style={styles.bigStatNumber}>${ingresosPagos.toFixed(2)}</Text>
                </View>
                {/* Caja del ícono de dinero a la derecha del número */}
                <View style={styles.bigIconBox}>
                    <Ionicons name="cash-outline" size={34} color="#050B14" />
                </View>
            </View>

            {/* Tarjeta de estadística secundaria (fondo gris oscuro) para las recargas de billetera */}
            {/* (Le pasamos estilos inline para sobreescribir el color de fondo y quitar la sombra) */}
            <View style={[styles.bigStatCard, { backgroundColor: '#1E293B', shadowColor: 'transparent' }]}>
                <View>
                    {/* (Color de texto gris para el label porque el fondo es más claro) */}
                    <Text style={[styles.bigStatLabel, { color: '#9CA3AF' }]}>Dinero Recargado en Billeteras</Text>
                    {/* (Color de texto blanco para el número grande) */}
                    <Text style={[styles.bigStatNumber, { color: '#FFFFFF' }]}>${ingresosRecargas.toFixed(2)}</Text>
                </View>
                {/* Caja del ícono de billetera con fondo verde semitransparente */}
                <View style={[styles.bigIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
                    <Ionicons name="wallet-outline" size={34} color="#00E676" />
                </View>
            </View>

            {/* Tarjeta que contiene la lista paginada de los últimos pagos QR */}
            <View style={styles.card}>
                {/* Encabezado de la tarjeta con título y conteo de pagos */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Últimos Pagos</Text>
                    {/* (Número total de pagos en la base de datos) */}
                    <Text style={styles.cardMuted}>{pagos.length}</Text>
                </View>

                {/* (Si no hay pagos, mostramos mensaje de lista vacía) */}
                {pagos.length === 0 ? (
                    <Text style={styles.emptyText}>No hay pagos registrados recientes.</Text>
                ) : (
                    // (Si hay pagos, mostramos los de la página actual)
                    <>
                        {/* (Recorremos los pagos de la página actual de la tabla de pagos) */}
                        {pagosPaginados.map((pago) => (
                            // (Cada pago es solo un View informativo, no es presionable porque no hay edición)
                            <View key={pago.id} style={styles.listItem}>
                                {/* Columna izquierda con el tipo de gasolina e ID del pago */}
                                <View style={{ flex: 1 }}>
                                    {/* (Tipo de gasolina en MAYÚSCULAS para legibilidad) */}
                                    <Text style={styles.listTitle}>Gasolina {pago.tipo_gasolina.toUpperCase()}</Text>
                                    {/* (Solo mostramos los primeros 8 caracteres del UUID para no ocupar mucho espacio) */}
                                    <Text style={styles.listText}>
                                        ID: {pago.id.split('-')[0]}...
                                    </Text>
                                </View>
                                {/* Columna derecha con el total en dinero y la fecha del pago */}
                                <View style={styles.listActions}>
                                    {/* (Monto formateado con 2 decimales y símbolo de dólar) */}
                                    <Text style={styles.listTitle}>${pago.total.toFixed(2)}</Text>
                                    {/* (Fecha del pago convertida a formato local legible) */}
                                    <Text style={styles.listText}>
                                        {new Date(pago.pagado_en).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {/* Controles de paginación de la lista de pagos */}
                        <View style={styles.paginationContainer}>
                            {/* Botón Anterior deshabilitado en la primera página de pagos */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaPagos === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaPagos(Math.max(1, paginaPagos - 1))}
                                disabled={paginaPagos === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                            
                            {/* Indicador de página actual sobre total de páginas de pagos */}
                            <Text style={styles.paginationText}>
                                Página {paginaPagos} de {totalPaginasPagos}
                            </Text>
                            
                            {/* Botón Siguiente deshabilitado en la última página de pagos */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaPagos === totalPaginasPagos && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaPagos(Math.min(totalPaginasPagos, paginaPagos + 1))}
                                disabled={paginaPagos === totalPaginasPagos}
                            >
                                <Text style={styles.paginationButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Tarjeta que contiene la lista paginada de las últimas recargas de billetera */}
            <View style={styles.card}>
                {/* Encabezado de la tarjeta con título y conteo de recargas */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Últimas Recargas</Text>
                    {/* (Número total de recargas en la base de datos) */}
                    <Text style={styles.cardMuted}>{recargas.length}</Text>
                </View>

                {/* (Si no hay recargas, mostramos mensaje de lista vacía) */}
                {recargas.length === 0 ? (
                    <Text style={styles.emptyText}>No hay recargas registradas recientes.</Text>
                ) : (
                    // (Si hay recargas, mostramos las de la página actual de la tabla de recargas)
                    <>
                        {/* (Recorremos las recargas de la página actual) */}
                        {recargasPaginadas.map((recarga) => (
                            // (Cada recarga es solo un View informativo)
                            <View key={recarga.id} style={styles.listItem}>
                                {/* Columna izquierda con el método de recarga e ID */}
                                <View style={{ flex: 1 }}>
                                    {/* (Método de pago usado para recargar: tarjeta de crédito, débito, etc) */}
                                    <Text style={styles.listTitle}>Recarga por {recarga.metodo}</Text>
                                    {/* (Solo los primeros 8 caracteres del UUID) */}
                                    <Text style={styles.listText}>
                                        ID: {recarga.id.split('-')[0]}...
                                    </Text>
                                </View>
                                {/* Columna derecha con el monto en verde y la fecha */}
                                <View style={styles.listActions}>
                                    {/* (El monto de recarga en verde porque es dinero entrante) */}
                                    <Text style={[styles.listTitle, { color: '#00E676' }]}>
                                        +${recarga.monto.toFixed(2)}
                                    </Text>
                                    {/* (Fecha de creación de la recarga convertida a formato local) */}
                                    <Text style={styles.listText}>
                                        {new Date(recarga.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {/* Controles de paginación de la lista de recargas (independiente de la de pagos) */}
                        <View style={styles.paginationContainer}>
                            {/* Botón Anterior deshabilitado en la primera página de recargas */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaRecargas === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaRecargas(Math.max(1, paginaRecargas - 1))}
                                disabled={paginaRecargas === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                            
                            {/* Indicador de página actual sobre total de páginas de recargas */}
                            <Text style={styles.paginationText}>
                                Página {paginaRecargas} de {totalPaginasRecargas}
                            </Text>
                            
                            {/* Botón Siguiente deshabilitado en la última página de recargas */}
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaRecargas === totalPaginasRecargas && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaRecargas(Math.min(totalPaginasRecargas, paginaRecargas + 1))}
                                disabled={paginaRecargas === totalPaginasRecargas}
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
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas AdminAnaliticas la pantalla de reportes desaparece y su ruta arrojará un error)
(si quitas useRequireRole cualquier usuario sin rol de admin podría ver los ingresos y movimientos del sistema)
(si quitas cargarAnaliticas los datos nunca se actualizarán al jalar la pantalla hacia abajo)
(si quitas la paginación independiente de pagos y recargas ambas listas se mezclarían y quedarían inutilizables)
(si quitas ingresosPagos o ingresosRecargas las tarjetas de resumen financiero mostrarán siempre $0.00)
*/
