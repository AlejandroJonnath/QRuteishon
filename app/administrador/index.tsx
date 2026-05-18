// Importamos los componentes visuales de React Native que usaremos en esta pantalla
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
// Importamos los íconos para los botones del menú
import { Ionicons } from '@expo/vector-icons';
// Importamos el guardián que bloquea la pantalla si el usuario no tiene el rol de admin
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook que trae el resumen del panel y los datos del admin
import { useAdminHome } from '../../hooks/AdminHooks/useAdminHome';
// Importamos los estilos globales del módulo de administración
import { styles } from '../_styles/AdminStyles';

// Sección
// Este archivo es la pantalla de inicio del panel de administrador
// Funciona como un menú principal que muestra un resumen de estadísticas
// y ofrece accesos directos a todas las secciones de gestión del sistema:
// clientes, operadores, administradores, cupones y analíticas

// Funciones
// AdminPanel: Componente principal que renderiza el dashboard completo del administrador
// con estadísticas en tiempo real, tarjetas de navegación y el botón de cierre de sesión

export default function AdminPanel() {
    // (Verificamos que quien entre aquí tenga el rol de admin, si no lo redirige automáticamente)
    // (loading es verdadero mientras el hook confirma el rol desde Supabase)
    const { loading } = useRequireRole('admin');

    // (Le pedimos al hook toda la información que necesitamos para poblar el panel)
    const {
        perfil,           // (Los datos del admin que está logueado)
        totalUsuarios,    // (Cuántos usuarios hay en total en el sistema)
        totalClientes,    // (Cuántos son clientes)
        totalOperadores,  // (Cuántos son operadores de gasolinera)
        totalAdmins,      // (Cuántos son administradores)
        totalPagos,       // (Cuántos pagos QR se han hecho)
        totalRecargas,    // (Cuántas recargas de saldo se han hecho)
        totalCupones,     // (Cuántos cupones existen en el sistema)
        loadingData,      // (Verdadero mientras se está descargando el resumen de Supabase)
        cargarResumen,    // (Función que recarga todos los números del dashboard)
        handleLogout,     // (Función que cierra la sesión del administrador)
        irClientes,       // (Función de navegación hacia la pantalla de CRUD de clientes)
        irOperadores,     // (Función de navegación hacia la pantalla de CRUD de operadores)
        irAdministradores,// (Función de navegación hacia la pantalla de CRUD de admins)
        irCupones,        // (Función de navegación hacia la pantalla de CRUD de cupones)
        irAnaliticas,     // (Función de navegación hacia la pantalla de analíticas)
    } = useAdminHome();

    // (Si el guardián todavía verifica el rol O si todavía se están cargando los datos)
    // (mostramos la pantalla de carga para no mostrar datos incompletos)
    if (loading || loadingData) {
        return (
            // (Contenedor centrado en pantalla)
            <View style={[styles.container, styles.center]}>
                {/* Ruedita verde grande girando */}
                <ActivityIndicator color="#00E676" size="large" />
                {/* Texto debajo de la ruedita */}
                <Text style={styles.loadingText}>Cargando panel administrador...</Text>
            </View>
        );
    }

    return (
        // (Pantalla desplazable verticalmente)
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            // (Control de actualización cuando el usuario jala la pantalla hacia abajo)
            refreshControl={
                <RefreshControl
                    // (Muestra la animación de carga si los datos se están actualizando)
                    refreshing={loadingData}
                    // (Ejecuta la recarga cuando el usuario suelta el gesto)
                    onRefresh={cargarResumen}
                    // (Color del spinner en iOS)
                    tintColor="#00E676"
                    // (Color del spinner en Android)
                    colors={['#00E676']}
                />
            }
        >
            {/* Sección de encabezado con saludo y descripción del panel */}
            <View style={styles.header}>
                {/* Saludo personalizado con el nombre de usuario del admin logueado */}
                {/* Si el perfil no cargó bien, ponemos "Administrador" como nombre por defecto */}
                <Text style={styles.greeting}>Hola, {perfil?.usuario || 'Administrador'}</Text>
                {/* Título del panel */}
                <Text style={styles.title}>Panel Administrador</Text>
                {/* Descripción corta de lo que se puede hacer desde aquí */}
                <Text style={styles.subtitle}>
                    Control general de perfiles, cupones y analíticas de QRuta.
                </Text>
            </View>

            {/* Cuadrícula de 4 tarjetas de estadísticas pequeñas (usuarios, clientes, operadores, admins) */}
            <View style={styles.statsGrid}>
                {/* Tarjeta de estadística: Total de usuarios */}
                <View style={styles.statCard}>
                    {/* Ícono de grupo de personas */}
                    <Ionicons name="people-outline" size={26} color="#00E676" />
                    {/* Número grande con el conteo */}
                    <Text style={styles.statNumber}>{totalUsuarios}</Text>
                    {/* Etiqueta descriptiva */}
                    <Text style={styles.statLabel}>Total Usuarios</Text>
                </View>

                {/* Tarjeta de estadística: Total de clientes */}
                <View style={styles.statCard}>
                    {/* Ícono de una sola persona */}
                    <Ionicons name="person-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalClientes}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                </View>

                {/* Tarjeta de estadística: Total de operadores */}
                <View style={styles.statCard}>
                    {/* Ícono de maletín representando al trabajador de gasolinera */}
                    <Ionicons name="briefcase-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalOperadores}</Text>
                    <Text style={styles.statLabel}>Operadores</Text>
                </View>

                {/* Tarjeta de estadística: Total de administradores */}
                <View style={styles.statCard}>
                    {/* Ícono de escudo con palomita representando los privilegios de admin */}
                    <Ionicons name="shield-checkmark-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalAdmins}</Text>
                    <Text style={styles.statLabel}>Admins</Text>
                </View>
            </View>

            {/* Tarjeta grande de actividad general que suma pagos + recargas + cupones */}
            <View style={styles.bigStatCard}>
                <View>
                    {/* Etiqueta descriptiva de la tarjeta */}
                    <Text style={styles.bigStatLabel}>Actividad general</Text>
                    {/* Suma de los tres contadores para dar un número global de transacciones */}
                    <Text style={styles.bigStatNumber}>{totalPagos + totalRecargas + totalCupones}</Text>
                </View>

                {/* Caja del ícono de analíticas a la derecha de los números */}
                <View style={styles.bigIconBox}>
                    <Ionicons name="analytics-outline" size={34} color="#050B14" />
                </View>
            </View>

            {/* Botón de acceso rápido a la sección de gestión de clientes */}
            <TouchableOpacity style={styles.optionCard} onPress={irClientes} activeOpacity={0.85}>
                {/* Ícono de perfil de persona grande en verde */}
                <Ionicons name="person-circle-outline" size={34} color="#00E676" />
                {/* Texto descriptivo de la opción */}
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de clientes</Text>
                    <Text style={styles.optionCardText}>
                        Registra clientes nuevos, edita datos y cambia sus estados.
                    </Text>
                </View>
                {/* Flecha a la derecha indicando que hay más dentro */}
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Botón de acceso rápido a la sección de gestión de operadores */}
            <TouchableOpacity style={styles.optionCard} onPress={irOperadores} activeOpacity={0.85}>
                <Ionicons name="briefcase-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de operadores</Text>
                    <Text style={styles.optionCardText}>
                        Crea operadores y asígnales una gasolinera para despachar.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Botón de acceso rápido a la sección de gestión de administradores */}
            <TouchableOpacity style={styles.optionCard} onPress={irAdministradores} activeOpacity={0.85}>
                <Ionicons name="shield-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de administradores</Text>
                    <Text style={styles.optionCardText}>
                        Gestiona al equipo administrativo del sistema.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Botón de acceso rápido a la sección de gestión de cupones */}
            <TouchableOpacity style={styles.optionCard} onPress={irCupones} activeOpacity={0.85}>
                <Ionicons name="ticket-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de cupones</Text>
                    <Text style={styles.optionCardText}>
                        Genera lotes masivos de cupones y modifícalos.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Botón de acceso rápido a la sección de analíticas y reportes */}
            <TouchableOpacity style={styles.optionCard} onPress={irAnaliticas} activeOpacity={0.85}>
                <Ionicons name="bar-chart-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Analíticas</Text>
                    <Text style={styles.optionCardText}>
                        Revisa pagos y recargas, e ingresos totales recientes.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Botón de cerrar sesión al fondo de la pantalla */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas AdminPanel la pantalla de inicio del administrador desaparece y al entrar con ese rol se verá un error de ruta)
(si quitas useRequireRole cualquier usuario sin importar su rol podría acceder al panel de administrador libremente)
(si quitas cargarResumen las estadísticas del dashboard quedarán en cero y nunca se actualizarán al recargar)
(si quitas handleLogout el administrador no podrá cerrar sesión y quedará atrapado en el panel)
(si quitas cualquiera de las funciones ir(...) el botón correspondiente no llevará a ningún lado y arrojará un error de navegación)
*/