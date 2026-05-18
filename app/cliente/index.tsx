// Importamos los componentes que nos da el React Native
// ScrollView permite crear una pantalla desplazable verticalmente
// View sirve como contenedor visual
// Text permite mostrar texto en pantalla
// TouchableOpacity permite crear botones presionables con efecto de opacidad
// ActivityIndicator muestra un indicador de carga
// RefreshControl permite actualizar la pantalla deslizando hacia abajo
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';// router permite navegar entre pantallas de la aplicación.
import { Ionicons } from '@expo/vector-icons';//Ionicons permite usar íconos dentro de la interfaz


// Este hook se usa para validar que el usuario tenga el rol correcto
// En este caso, se usará para verificar que el usuario sea cliente
import { useRequireRole } from '../../hooks/useRequireRole';

// Este hook concentra la lógica del panel del cliente
// Desde aquí se obtienen datos como perfil, billetera, movimientos, cupones y funciones de navegación
import { useClienteLogic } from '../../hooks/ClienteHooks/useClienteLogic';

// Importamos los estilos de la pantalla del cliente
import { styles } from '../_styles/ClienteStyles/clienteStyles';

// Sección
// Este archivo es la pantalla principal del panel de cliente
// Muestra el saldo actual de la billetera, los botones de acción rápida (pagar con QR y recargar),
// la tarjeta virtual Q-Ruta, los cupones disponibles y el historial de movimientos recientes
// También tiene el botón para cerrar sesión al fondo de la pantalla

// Funciones
// ClientePanel: Componente principal que dibuja toda la interfaz del panel del cliente
// con todos sus datos financieros y opciones de navegación

export default function ClientePanel() {

    // Usamos el hook useRequireRole para verificar que el usuario tenga el rol "cliente"
    // loading indica si todavía se está validando el rol o la sesión
    const { loading } = useRequireRole('cliente');

    // Usamos el hook useClienteLogic para obtener toda la lógica y datos del cliente
    // Este hook separa la lógica de negocio de la interfaz visual
    const {
        perfil,
        billetera,
        movimientos,
        cupones,
        loadingData,
        cargarDatosCliente,
        handleLogout,// handleLogout es la función que permite cerrar sesión
        irARecargar,
        irAPagarQr,
    } = useClienteLogic();

    // Esta parte es la que controla la pantalla de carga
    // Si todavía se está validando el rol o cargando los datos del cliente,
    // se muestra un indicador de carga antes de mostrar el panel completo
    if (loading || loadingData) {
        // Retornamos una vista centrada mientras la información se carga
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Cargando panel...</Text>
            </View>
        );
    }

    // Convertimos el saldo de la billetera a número
    // Si billetera no existe o saldo viene vacío, se usa 0 como valor por defecto
    // toFixed(2) asegura que el saldo siempre se muestre con dos decimales
    const saldo = Number(billetera?.saldo || 0).toFixed(2);

    // Obtenemos el estado de la tarjeta desde billetera.
    // Si no existe billetera o estado, se muestra "sin billetera".
    const estadoTarjeta = billetera?.estado || 'sin billetera';

    //Lo mismo de arriba pero de la tarjeta
    const numeroTarjeta = billetera?.numero_tarjeta || 'Sin tarjeta Q-Ruta';

    //Retornamos la UI principal al cliente
    return (
        // ScrollView permite que todo el contenido sea desplazable
        // Esto es útil porque la pantalla tiene varias secciones:
        // saldo, botones, tarjeta, cupones, movimientos y logout
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                // RefreshControl controla el gesto de actualización (cuando haces para arriba el dedo para poder actualizar básicamente)
                <RefreshControl
                    // refreshing indica si actualmente se está refrescando la información
                    refreshing={loadingData}
                    // onRefresh define qué función se ejecuta cuando el usuario desliza hacia abajo
                    onRefresh={cargarDatosCliente}
                    //Color para IOS
                    tintColor="#00E676"
                    //Color para Android
                    colors={['#00E676']}
                />
            }
        >
            {/* Header */}
            {/* Sección de Bienvenida */}
            <View style={styles.header}>
                {/* Muestra un saludo personalizado */}
                {/* Si existe perfil.usuario, se muestra ese nombre */}
                {/* Si no existe, se muestra "Cliente" como valor por defecto */}
                <Text style={styles.greeting}>Hola, {perfil?.usuario || 'Cliente'}</Text>
                <Text style={styles.title}>Panel Cliente</Text>
                <Text style={styles.subtitle}>Paga combustible de forma rápida con QRuta.</Text>
            </View>

            {/* Tarjeta visual donde se muestra el saldo actual del cliente */}
            <View style={styles.balanceCard}>
                {/* Etiqueta que indica que el valor mostrado corresponde al saldo actual */}
                <Text style={styles.balanceLabel}>Saldo actual</Text>
                {/* Muestra el saldo formateado con símbolo de dólar */}
                <Text style={styles.balanceAmount}>${saldo}</Text>
                {/* Texto de apoyo que explica para qué sirve ese saldo */}
                <Text style={styles.balanceFooter}>Disponible para pagos con Tarjeta Q-Ruta</Text>
            </View>

            {/* Fila de acciones principales del cliente */}
            {/* Aquí están los botones para pagar con QR y recargar saldo */}
            <View style={styles.actionRow}>
                {/* Botón principal para pagar con QR */}
                {/* onPress ejecuta irAPagarQr cuando el usuario toca el botón */}
                {/* activeOpacity define la opacidad visual al presionar el botón */}
                <TouchableOpacity style={styles.primaryButton} onPress={irAPagarQr} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Pagar con QR</Text>
                </TouchableOpacity>

                {/* Botón secundario para recargar saldo */}
                {/* onPress ejecuta irARecargar cuando el usuario toca el botón */}
                {/* activeOpacity define el efecto visual al presionar */}
                <TouchableOpacity style={styles.secondaryButton} onPress={irARecargar} activeOpacity={0.85}>
                    <Text style={styles.secondaryButtonText}>Recargar saldo</Text>
                </TouchableOpacity>
            </View>

            {/* Botón ancho para navegar hacia la pantalla de métodos de pago */}
            <TouchableOpacity
                // Aplicamos estilos al botón
                style={styles.fullButton}
                //Cuando se presione el botón, lo mandará a la ruta de los métodos de pago
                onPress={() => router.push('/cliente/metodos-pagos')}
                // Definimos la opacidad cuando el user presione el botón
                activeOpacity={0.85}
            >
                {/* Ícono de tarjeta mostrado dentro del botón */}
                <Ionicons
                    name="card-outline"
                    size={20}
                    color="#FFFFFF"
                    style={styles.fullButtonIcon}
                />
                {/* Texto del botón para agregar método de pago */}
                <Text style={styles.fullButtonText}>Agregar método de pago</Text>
            </TouchableOpacity>

            {/* Creamos una card que muestre la info de la tarjeta de Q-Ruta */}
            <View style={styles.card}>
                {/* Encabezado */}
                <View style={styles.cardHeader}>
                    {/* Título */}
                    <Text style={styles.cardTitle}>Tarjeta Q-Ruta</Text>
                    {/* Subtítulo */}
                    <Text style={styles.cardMuted}>Virtual</Text>
                </View>

                {/* Contenedor visual que representa la tarjeta virtual */}
                <View style={styles.virtualCard}>
                    {/* Encabezado */}
                    <View style={styles.virtualCardHeader}>
                        {/* Le añadímos un ícono de tarjeta */}
                        <Ionicons name="card" size={22} color="#00E676" />
                        {/* Nombre de la tarjeta */}
                        <Text style={styles.virtualCardTitle}>Q-Ruta</Text>
                    </View>
                    {/* Número de tarjeta Q-Ruta */}
                    {/* Si no existe tarjeta, se mostrará el texto por defecto definido en numeroTarjeta */}
                    <Text style={styles.qrCardNumber}>{numeroTarjeta}</Text>
                </View>

                {/* Fila de información para mostrar el estado de la tarjeta */}
                <View style={styles.infoRow}>
                    {/*Info de la etiqueta*/}
                    <Text style={styles.infoLabel}>Estado</Text>
                    {/*Estado de la tarjeta */}
                    <Text style={styles.infoValue}>{estadoTarjeta}</Text>
                </View>

                {/*Mostrara el saldo de la tarjeta */}
                <View style={styles.infoRow}>
                    {/*Información */}
                    <Text style={styles.infoLabel}>Saldo de tarjeta</Text>
                    {/*Verificación de saldo */}
                    <Text style={styles.infoValue}>${saldo}</Text>
                </View>
            </View>
            {/*Mostrara los cupones que tiene disponibles */}
            <View style={styles.card}>
                {/*Encabezado */}
                <View style={styles.cardHeader}>
                    {/*Título de la card */}
                    <Text style={styles.cardTitle}>Cupones disponibles</Text>
                    {/*Mostrará los cupones que tiene disponibles en números */}
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {/* Validamos si el cliente no tiene cupones. */}
                {cupones.length === 0 ? (
                    // Si no hay cupones, el mensaje estará vacío
                    <Text style={styles.emptyText}>No tienes cupones disponibles.</Text>
                ) : (
                    //En caso que si haya cupones, simplemente recorremos el array
                    cupones.map((cupon) => (
                        // Cada cupón se renderiza como un item visual
                        // key={cupon.id} ayuda a React a identificar cada elemento de la lista
                        <View key={cupon.id} style={styles.couponItem}>
                            {/* Muestra el código del cupón */}
                            <Text style={styles.couponCode}>{cupon.codigo}</Text>
                            {/* Styles del cpón */}
                            <Text style={styles.couponText}>

                                {cupon.tipo_descuento === 'porcentaje'
                                    // Si el tipo de descuento es porcentaje, se muestra como porcentaje  
                                    ? `${cupon.valor_descuento}% de descuento`
                                    // Si no es porcentaje, se muestra como valor monetario 
                                    : `$${Number(cupon.valor_descuento).toFixed(2)} de descuento`}
                            </Text>
                            <Text style={styles.couponText}>
                                Código único y de un solo uso
                            </Text>
                        </View>
                    ))
                )}
            </View>

            {/* Card que muestra los últimos movimientos del cliente */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Últimos movimientos</Text>
                    <Text style={styles.cardMuted}>Recientes</Text>
                </View>

                {/* Validamos si no existen movimientos registrados */}
                {movimientos.length === 0 ? (
                    // Si no hay movimientos, le mandamos un mensaje de que no tiene movimientos aún
                    <Text style={styles.emptyText}>Aún no tienes movimientos.</Text>
                ) : (
                    // Si existen movimientos, se recorre el array de movimientos
                    movimientos.map((movimiento) => {
                        // Convertimos el monto del movimiento a número
                        // Si movimiento.monto no existe, se usa 0 como valor por defecto
                        const monto = Number(movimiento.monto || 0);
                        // Determinamos si el movimiento es positivo o negativo
                        // Si el monto es mayor o igual a 0, se considera positivo
                        const esPositivo = monto >= 0;

                        // Retornamos la UI al usuario acerca del movimiento
                        return (
                            // Contenedor principal de cada movimiento
                            // key={movimiento.id} permite identificar cada movimiento en la lista
                            <View key={movimiento.id} style={styles.movementItem}>
                                {/* Contenedor izquierdo del movimiento */}
                                {/* flex: 1 permite que ocupe el espacio disponible */}
                                {/* paddingRight: 12 agrega separación con el monto de la derecha */}
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    {/* Muestra el tipo de movimiento */}
                                    <Text style={styles.movementTitle}>{movimiento.tipo}</Text>
                                    {/* Muestra la descripción del movimiento */}
                                    <Text style={styles.movementDescription}>
                                        {/* Si existe descripción, se muestra */}
                                        {/* Si no existe, se muestra "Movimiento QRuta" */}
                                        {movimiento.descripcion || 'Movimiento QRuta'}
                                    </Text>
                                </View>

                                {/* Muestra el monto del movimiento. */}
                                {/* El estilo cambia dependiendo de si el monto es positivo o negativo. */}
                                <Text
                                    style={

                                        esPositivo
                                            ? styles.movementAmountPositive
                                            : styles.movementAmountNegative
                                    }
                                >
                                    {/* Si el monto es positivo, se muestra el signo + */}
                                    {/* Si el monto es negativo, se muestra el signo - */}
                                    {/* Math.abs evita mostrar doble negativo porque convierte el monto a valor absoluto */}
                                    {/* toFixed(2) muestra el monto con dos decimales */}
                                    {esPositivo ? '+' : '-'}${Math.abs(monto).toFixed(2)}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>

            {/* Botón para cerrar sesión */}
            {/* onPress ejecuta handleLogout cuando el usuario toca el botón */}
            {/* activeOpacity define el efecto visual al presionar */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                {/* Texo que dirá cerrar sesión */}
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas ClientePanel la pantalla principal del cliente desaparece y su ruta arrojará un error al entrar)
(si quitas useRequireRole cualquier usuario sin importar su rol podría ver el panel del cliente)
(si quitas useClienteLogic no habrá datos para mostrar: ni saldo, ni cupones, ni movimientos)
(si quitas cargarDatosCliente la pantalla no se actualizará al jalar hacia abajo y los datos quedarán obsoletos)
(si quitas handleLogout el cliente no podrá cerrar sesión y quedará atrapado en el panel)
(si quitas irAPagarQr el botón de pagar con QR no llevará a ninguna pantalla)
(si quitas irARecargar el botón de recargar saldo no llevará a ninguna pantalla)
*/