// Importamos los componentes visuales de React Native que usaremos para armar esta pantalla
import {
    View,
    Text,
    TouchableOpacity,     // (Botones presionables con efecto de opacidad)
    TextInput,            // (Campo de texto para escribir el monto)
    ActivityIndicator,    // (Ruedita giratoria de carga)
    KeyboardAvoidingView, // (Empuja el contenido hacia arriba cuando aparece el teclado)
    Platform,             // (Detecta si el dispositivo es iOS o Android)
    ScrollView,           // (Contenedor desplazable verticalmente)
    RefreshControl,       // (Control para jalar hacia abajo y recargar la pantalla)
} from 'react-native';
// Importamos el router para poder ir a otras pantallas o volver atrás
import { router } from 'expo-router';
// Importamos el guardián que verifica que quien entra sea cliente
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook y la constante del monto máximo permitido por recarga
// (MONTO_MAXIMO_RECARGA está definido en el hook para centralizar esa regla de negocio)
import { useRecarga, MONTO_MAXIMO_RECARGA } from '../../hooks/ClienteHooks/UseRecarga';
// Importamos los estilos de esta pantalla
import { styles } from '../_styles/ClienteStyles/RecargarStyles';

// Sección
// Este archivo es la pantalla donde el cliente puede recargar saldo a su billetera Q-Ruta
// El proceso es una simulación: el cliente elige una tarjeta de crédito/débito previamente registrada,
// escribe cuánto quiere recargar, opcionalmente aplica un cupón de descuento
// y confirma la operación que agrega ese saldo a su billetera virtual para futuros pagos QR
// Hay un límite máximo de recarga importado desde la constante MONTO_MAXIMO_RECARGA

// Funciones
// RecargarSaldo: Componente principal que dibuja el formulario completo de recarga con
// selección de tarjeta, selección de cupón, resumen de descuento/total y el botón de confirmar

export default function RecargarSaldo() {
    // (Verificamos que quien entra sea cliente, si no lo redirige al login)
    useRequireRole('cliente');

    // (Desestructuramos todo lo que nos da el hook de recarga)
    const {
        monto,                    // (Valor del campo de texto del monto a recargar)
        setMonto,                 // (Actualiza el campo de monto)
        loading,                  // (Verdadero mientras se procesa la recarga con Supabase)
        loadingData,              // (Verdadero mientras se cargan los datos iniciales de tarjetas y cupones)

        metodosPago,              // (Lista de tarjetas activas del cliente)
        metodoPagoSeleccionado,   // (La tarjeta que el cliente eligió para pagar)
        setMetodoPagoSeleccionado,// (Función para cambiar la tarjeta seleccionada)

        cupones,                  // (Lista de cupones disponibles del cliente)
        cuponSeleccionado,        // (El cupón que el cliente eligió aplicar, null si no usa ninguno)
        setCuponSeleccionado,     // (Función para cambiar el cupón seleccionado)

        descuentoCupon,           // (Monto calculado de descuento basado en el cupón y el monto)
        totalSimuladoAPagar,      // (Monto final después de aplicar el descuento del cupón)

        cargarDatosRecarga,       // (Función que recarga los datos al jalar hacia abajo)
        handleRecargar,           // (Función principal que procesa la recarga y actualiza la billetera)
    } = useRecarga();

    // (Si los datos iniciales aún están cargando, mostramos la pantalla de espera)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>
                    Cargando datos de recarga...
                </Text>
            </View>
        );
    }

    return (
        // (KeyboardAvoidingView asegura que en iOS el teclado no tape los campos del formulario)
        <KeyboardAvoidingView
            style={styles.container}
            // (En iOS usamos 'padding' que empuja el contenido, en Android no es necesario)
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* ScrollView desplazable con control de actualización jalando hacia abajo */}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        // (Muestra la animación mientras se actualizan los datos)
                        refreshing={loadingData}
                        // (Llama a la función de recarga cuando el usuario suelta el gesto)
                        onRefresh={cargarDatosRecarga}
                        tintColor="#00E676"
                        colors={['#00E676']}
                    />
                }
            >
                {/* Encabezado con el título y la descripción de la pantalla */}
                <View style={styles.header}>
                    <Text style={styles.title}>Recargar saldo</Text>
                    <Text style={styles.text}>
                        Selecciona una tarjeta activa y canjea un cupón si tienes disponible.
                    </Text>
                </View>

                {/* Tarjeta principal del formulario de recarga */}
                <View style={styles.card}>
                    {/* Etiqueta del campo de monto */}
                    <Text style={styles.label}>Monto a recargar</Text>

                    {/* Campo de texto para escribir cuánto dinero se quiere recargar */}
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 25.00"
                        placeholderTextColor="#6B7280"
                        // (Valor controlado vinculado al estado del hook)
                        value={monto}
                        // (Actualiza el estado cuando el usuario escribe)
                        onChangeText={setMonto}
                        // (Teclado decimal para poder poner valores como 25.50)
                        keyboardType="decimal-pad"
                    />

                    {/* Texto informativo que muestra el límite máximo de recarga permitido */}
                    {/* (Usamos la constante importada del hook para que sea consistente con la validación) */}
                    <Text style={styles.limitText}>
                        Monto máximo permitido: ${MONTO_MAXIMO_RECARGA.toFixed(2)}
                    </Text>

                    {/* Sección de selección de tarjeta de pago */}
                    <Text style={styles.label}>Tarjeta de crédito o débito</Text>

                    {/* (Si el cliente no tiene tarjetas registradas, mostramos un mensaje de advertencia con botón de acceso rápido) */}
                    {metodosPago.length === 0 ? (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>
                                No tienes tarjetas activas
                            </Text>

                            <Text style={styles.warningText}>
                                Para recargar, primero debes agregar una tarjeta simulada de crédito o débito.
                            </Text>

                            {/* Botón de acceso directo a la pantalla de métodos de pago para agregar una tarjeta */}
                            <TouchableOpacity
                                style={styles.addPaymentButton}
                                onPress={() => router.push('/cliente/metodos-pagos')}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.addPaymentText}>
                                    Agregar tarjeta
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // (Si tiene tarjetas, las listamos todas para que elija una)
                        metodosPago.map((tarjeta) => {
                            // (Verificamos si esta tarjeta del ciclo es la que está seleccionada actualmente)
                            const activa = metodoPagoSeleccionado?.id === tarjeta.id;

                            return (
                                // (Cada tarjeta es un botón que al presionar la selecciona)
                                <TouchableOpacity
                                    key={tarjeta.id}
                                    style={[
                                        styles.paymentCard,
                                        // (Si está seleccionada, le aplicamos el estilo resaltado)
                                        activa && styles.paymentCardActive,
                                    ]}
                                    // (Actualizamos el método de pago seleccionado con la tarjeta tocada)
                                    onPress={() => setMetodoPagoSeleccionado(tarjeta)}
                                    activeOpacity={0.85}
                                >
                                    <View>
                                        {/* (Mostramos el tipo de tarjeta y la marca: ej "Crédito · Visa") */}
                                        <Text
                                            style={[
                                                styles.paymentTitle,
                                                activa && styles.paymentTitleActive,
                                            ]}
                                        >
                                            {tarjeta.tipo === 'credito' ? 'Crédito' : 'Débito'} · {tarjeta.marca || 'Tarjeta'}
                                        </Text>

                                        {/* (Los últimos 4 dígitos precedidos de asteriscos para simular privacidad) */}
                                        <Text
                                            style={[
                                                styles.paymentText,
                                                activa && styles.paymentTextActive,
                                            ]}
                                        >
                                            **** **** **** {tarjeta.ultimos_4}
                                        </Text>
                                    </View>

                                    {/* (Badge a la derecha que dice "Seleccionada" si está activa, "Usar" si no) */}
                                    <Text
                                        style={[
                                            styles.paymentBadge,
                                            activa && styles.paymentBadgeActive,
                                        ]}
                                    >
                                        {activa ? 'Seleccionada' : 'Usar'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {/* Sección de selección de cupón de descuento */}
                    <Text style={styles.label}>Cupones para canjear</Text>

                    {/* Opción por defecto para no aplicar ningún cupón */}
                    <TouchableOpacity
                        style={[
                            styles.couponCard,
                            // (Se resalta si no hay ningún cupón seleccionado, indicando que es la opción activa)
                            !cuponSeleccionado && styles.couponCardActive,
                        ]}
                        // (Al presionar, se borra el cupón seleccionado)
                        onPress={() => setCuponSeleccionado(null)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.couponCode}>Sin cupón</Text>
                        <Text style={styles.couponText}>
                            Recargar sin aplicar descuento.
                        </Text>
                    </TouchableOpacity>

                    {/* (Si no tiene cupones disponibles, mostramos un texto indicándolo) */}
                    {cupones.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No tienes cupones disponibles.
                        </Text>
                    ) : (
                        // (Si tiene cupones, los listamos uno por uno)
                        cupones.map((cupon) => {
                            // (Verificamos si este cupón del ciclo es el que está seleccionado)
                            const activo = cuponSeleccionado?.id === cupon.id;

                            return (
                                // (Cada cupón es un botón que al presionar lo selecciona)
                                <TouchableOpacity
                                    key={cupon.id}
                                    style={[
                                        styles.couponCard,
                                        // (Si está seleccionado, se aplica el estilo resaltado)
                                        activo && styles.couponCardActive,
                                    ]}
                                    onPress={() => setCuponSeleccionado(cupon)}
                                    activeOpacity={0.85}
                                >
                                    {/* (El código único del cupón) */}
                                    <Text style={styles.couponCode}>
                                        {cupon.codigo}
                                    </Text>

                                    {/* (El valor del descuento formateado según el tipo: % o $) */}
                                    <Text style={styles.couponText}>
                                        {cupon.tipo_descuento === 'porcentaje'
                                            ? `${cupon.valor_descuento}% de descuento simulado`
                                            : `$${Number(cupon.valor_descuento).toFixed(2)} de descuento simulado`}
                                    </Text>

                                    {/* (Aviso de que es de un solo uso para que el cliente sepa que se gastará) */}
                                    <Text style={styles.couponSmall}>
                                        Código único y de un solo uso
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {/* Recuadro de resumen que muestra el descuento y el total a pagar en tiempo real */}
                    <View style={styles.summaryBox}>
                        {/* Fila del descuento aplicado por el cupón */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Descuento simulado
                            </Text>
                            {/* (Mostramos el descuento con signo negativo y 2 decimales) */}
                            <Text style={styles.summaryValue}>
                                -${descuentoCupon.toFixed(2)}
                            </Text>
                        </View>

                        {/* Fila del total final después del descuento */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Total simulado a pagar
                            </Text>
                            {/* (Total resaltado en verde más grande para que destaque) */}
                            <Text style={styles.summaryTotal}>
                                ${totalSimuladoAPagar.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Botón principal para confirmar y procesar la recarga */}
                    <TouchableOpacity
                        // (Se vuelve opaco si está procesando)
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRecargar}
                        // (Bloqueamos el botón si está procesando O si no hay tarjetas para pagar)
                        disabled={loading || metodosPago.length === 0}
                        activeOpacity={0.85}
                    >
                        {/* (Ruedita mientras procesa, texto cuando está libre) */}
                        {loading ? (
                            <ActivityIndicator color="#0B132B" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Confirmar recarga
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Botón para volver sin hacer la recarga */}
                    {/* (Deshabilitado mientras se procesa para evitar salir a mitad de la operación) */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={styles.backText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas RecargarSaldo la pantalla de recarga desaparece y los clientes no podrán añadir saldo a su billetera)
(si quitas useRequireRole cualquier usuario sin importar su rol podría acceder a recargar saldos)
(si quitas handleRecargar el botón de confirmar no hará nada y el saldo nunca se actualizará)
(si quitas cargarDatosRecarga la lista de tarjetas y cupones no se actualizará al jalar la pantalla)
(si quitas el control de metodosPago.length === 0 el usuario podría intentar recargar sin tarjeta y la operación fallaría en Supabase con un error confuso)
(si quitas MONTO_MAXIMO_RECARGA el límite de recarga deja de mostrarse y el hook podría rechazar montos sin que el usuario sepa cuál es el máximo permitido)
*/