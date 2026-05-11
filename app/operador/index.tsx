// Importamos componentes
import {
    // View sirve como contenedor para agrupar otros componentes visuales
    View,

    // Text permite mostrar texto en la interfaz
    Text,

    // TouchableOpacity permite crear botones o zonas presionables con efecto de opacidad
    TouchableOpacity,

    // ActivityIndicator muestra un indicador de carga mientras se espera una operación
    ActivityIndicator,

    // ScrollView permite que el contenido de la pantalla pueda desplazarse verticalmente
    ScrollView,
} from 'react-native';

// Importamos Ionicons
// Ionicons permite usar íconos visuales dentro de botones, tarjetas o secciones de la app
import { Ionicons } from '@expo/vector-icons';

// Importamos el hook 
// Este hook se encarga de validar que el usuario tenga el rol correcto para entrar a esta pantalla
import { useRequireRole } from '../../hooks/useRequireRole';

// Importamos el hook de useOperadorLogic
// Este hook contiene la lógica del panel del operador
// Aquí se manejan datos del perfil, cierre de sesión y navegación hacia otras pantallas
import { useOperadorLogic } from '../../hooks/OperadorHooks/useOperadorLogic';

// Importamos los estilos
import { styles } from '../_styles/OperadorStyles/operadorStyles';

// Exportamos el componente principal OperadorPanel
export default function OperadorPanel() {
    // Usamos useRequireRole para comprobar que el usuario autenticado tenga el rol operador
    // loading indica si todavía se está validando el acceso del usuario
    const { loading } = useRequireRole('operador');

    // Usamos useOperadorLogic para obtener datos y funciones necesarias para esta pantalla
    // Este hook ayuda a separar la lógica de la interfaz visual
    const {
        // perfil contiene los datos del operador autenticado
        // Por ejemplo usuario, rol y estado
        perfil,

        // handleLogout es la función encargada de cerrar la sesión del operador
        handleLogout,

        // irAgregarPago es la función que navega hacia la pantalla para agregar un pago y generar un QR
        irAgregarPago,

        // irHistorialCupones es la función que navega hacia la pantalla del historial de cupones
        irHistorialCupones,

        // irGenerarFactura es la función que navega hacia la pantalla para generar una factura simulada
        irGenerarFactura,
    } = useOperadorLogic();

    // Este bloque controla el estado de carga inicial de la pantalla
    // Si loading es verdadero, significa que aún se está verificando el rol del usuario
    // Si perfil no existe, significa que todavía no se tienen los datos del operador
    if (loading || !perfil) {
        // Mientras se valida el rol o se cargan los datos, se muestra una pantalla de carga
        return (
            // View actúa como contenedor principal de la pantalla de carga
            // styles.container aplica el estilo base de la pantalla
            // styles.center centra el contenido dentro de la pantalla
            <View style={[styles.container, styles.center]}>
                {/* ActivityIndicator muestra un spinner de carga */}
                {/* color define el color verde del indicador */}
                {/* size="large" hace que el indicador se muestre en tamaño grande */}
                <ActivityIndicator color="#00E676" size="large" />

                {/* Text muestra un mensaje mientras el panel termina de cargar */}
                {/* styles.loadingText define el diseño visual del texto de carga */}
                <Text style={styles.loadingText}>Cargando panel...</Text>
            </View>
        );
    }

    // Si ya terminó la carga y existe el perfil del operador, se muestra el panel principal
    return (
        // ScrollView permite desplazar el contenido verticalmente
        // Es útil porque esta pantalla tiene varias secciones y puede no caber completa en algunos dispositivos
        <ScrollView
            // style aplica el estilo principal al contenedor externo del ScrollView
            style={styles.container}

            // contentContainerStyle aplica estilos al contenido interno del ScrollView
            contentContainerStyle={styles.content}
        >
            {/* Bloque de encabezado de la pantalla */}
            {/* Aquí se muestra el saludo, el título y una breve descripción del panel */}
            <View style={styles.header}>
                {/* Muestra un saludo usando el nombre de usuario del perfil del operador */}
                <Text style={styles.greeting}>Hola, {perfil.usuario}</Text>

                {/* Muestra el título principal de la pantalla */}
                <Text style={styles.title}>Panel Operador</Text>

                {/* Muestra una descripción de las acciones principales que puede hacer el operador */}
                <Text style={styles.subtitle}>
                    Genera pagos QR, administra cupones y emite facturas simuladas.
                </Text>
            </View>

            {/* Tarjeta principal del panel */}
            {/* Esta sección destaca la función más importante del operador: crear cobros con QR */}
            <View style={styles.mainCard}>
                {/* Contenedor visual para el ícono principal */}
                <View style={styles.mainIconBox}>
                    {/* Ícono de código QR */}
                    {/* name define el ícono que se va a mostrar */}
                    {/* size define el tamaño del ícono */}
                    {/* color define el color del ícono */}
                    <Ionicons name="qr-code-outline" size={42} color="#0B132B" />
                </View>

                {/* Título de la tarjeta principal */}
                <Text style={styles.mainTitle}>Cobro con QR</Text>

                {/* Texto descriptivo de la tarjeta principal */}
                <Text style={styles.mainText}>
                    Crea un pago para que el cliente lo escanee desde su app QRuta.
                </Text>

                {/* Botón principal para agregar un pago y generar el QR */}
                <TouchableOpacity
                    // style aplica el diseño visual del botón principal
                    style={styles.primaryButton}

                    // onPress ejecuta la función irAgregarPago cuando el operador toca el botón
                    onPress={irAgregarPago}

                    // activeOpacity define la opacidad del botón cuando es presionado
                    activeOpacity={0.85}
                >
                    {/* Texto interno del botón principal */}
                    <Text style={styles.primaryButtonText}>
                        Agregar pago y generar QR
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bloque de opciones secundarias del operador */}
            {/* Esta sección contiene accesos rápidos a historial de cupones y generación de facturas */}
            <View style={styles.sectionGrid}>
                {/* Tarjeta de opción para entrar al historial de cupones */}
                <TouchableOpacity
                    // style aplica el diseño de tarjeta para esta opción
                    style={styles.optionCard}

                    // onPress ejecuta la navegación hacia el historial de cupones
                    onPress={irHistorialCupones}

                    // activeOpacity define el efecto visual al presionar la tarjeta
                    activeOpacity={0.85}
                >
                    {/* Ícono relacionado con cupones o tickets */}
                    <Ionicons name="ticket-outline" size={30} color="#00E676" />

                    {/* Título de la opción de historial de cupones */}
                    <Text style={styles.optionTitle}>Historial de cupones</Text>

                    {/* Descripción corta de lo que hace esta opción */}
                    <Text style={styles.optionText}>
                        Consulta los cupones disponibles o usados.
                    </Text>
                </TouchableOpacity>

                {/* Tarjeta de opción para generar una factura */}
                <TouchableOpacity
                    // style aplica el diseño de tarjeta para esta opción
                    style={styles.optionCard}

                    // onPress ejecuta la navegación hacia la pantalla de generación de factura
                    onPress={irGenerarFactura}

                    // activeOpacity define el efecto visual al presionar la tarjeta
                    activeOpacity={0.85}
                >
                    {/* Ícono relacionado con documentos o facturas */}
                    <Ionicons name="document-text-outline" size={30} color="#00E676" />

                    {/* Título de la opción para generar factura */}
                    <Text style={styles.optionTitle}>Generar factura</Text>

                    {/* Descripción corta de lo que hace esta opción */}
                    <Text style={styles.optionText}>
                        Emite una factura simulada con datos del cliente.
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tarjeta informativa con los datos del operador */}
            {/* Esta sección muestra información básica del perfil autenticado */}
            <View style={styles.infoCard}>
                {/* Título de la tarjeta de información */}
                <Text style={styles.infoTitle}>Datos del operador</Text>

                {/* Fila de información para mostrar el usuario del operador */}
                <View style={styles.infoRow}>
                    {/* Etiqueta que indica el tipo de dato mostrado */}
                    <Text style={styles.infoLabel}>Usuario</Text>

                    {/* Valor real del usuario obtenido desde perfil */}
                    <Text style={styles.infoValue}>{perfil.usuario}</Text>
                </View>

                {/* Fila de información para mostrar el rol del operador */}
                <View style={styles.infoRow}>
                    {/* Etiqueta que indica que el dato corresponde al rol */}
                    <Text style={styles.infoLabel}>Rol</Text>

                    {/* Valor real del rol obtenido desde perfil */}
                    <Text style={styles.infoValue}>{perfil.rol}</Text>
                </View>

                {/* Fila de información para mostrar el estado del operador */}
                <View style={styles.infoRow}>
                    {/* Etiqueta que indica que el dato corresponde al estado */}
                    <Text style={styles.infoLabel}>Estado</Text>

                    {/* Valor real del estado obtenido desde perfil */}
                    <Text style={styles.infoValue}>{perfil.estado}</Text>
                </View>
            </View>

            {/* Botón para cerrar sesión */}
            <TouchableOpacity
                // style aplica el diseño visual del botón de cierre de sesión
                style={styles.logoutButton}

                // onPress ejecuta handleLogout cuando el operador toca el botón
                onPress={handleLogout}

                // activeOpacity define la opacidad del botón cuando es presionado
                activeOpacity={0.85}
            >
                {/* Texto interno del botón de cierre de sesión */}
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}