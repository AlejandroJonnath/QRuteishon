// Importamos los componentes visuales nativos para armar la pantalla
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
// Importamos router para poder navegar o regresar atrás
import { router } from 'expo-router';
// Importamos la librería mágica que dibuja el código QR en pantalla
import QRCode from 'react-native-qrcode-svg';
// Importamos los íconos
import { Ionicons } from '@expo/vector-icons';
// Importamos el guardián de seguridad
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos toda la lógica pesada, variables y tipos de datos necesarios para generar un pago
import {
    useAgregarPago,
    MetodoPagoCliente,
    TipoGasolina,
} from '../../hooks/OperadorHooks/UseAgregarPago';
// Importamos la capa de pintura (estilos)
import { styles } from '../_styles/OperadorStyles/AgregarPagoStyles';

// Sección
// Este archivo es la pantalla principal del negocio, donde el operador crea un cobro, elige si hay descuento y la app le dibuja un código QR en la pantalla para que el cliente lo escanee con su celular

// Funciones
// AgregarPago: Muestra el formulario para escribir el monto de gasolina, elegir el tipo, el método de pago y aplicar cupones, para luego generar y mostrar el QR resultante

export default function AgregarPago() {
    // (Verificamos que nadie que no sea operador ande husmeando por aquí)
    useRequireRole('operador');

    // (Nos traemos tooooodas las variables y herramientas del cerebro del pago)
    const {
        valor,
        setValor,
        metodoPago,
        setMetodoPago,
        tipoGasolina,
        setTipoGasolina,
        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,
        descuentoCalculado,
        totalCalculado,
        loading,
        loadingData,
        pagoGenerado,
        qrValue,
        cargarCuponesOperador,
        generarPagoQr,
        crearOtroPago,
    } = useAgregarPago();

    // (Si está descargando la información del operador, le mostramos la típica pantalla negra de espera)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando datos del operador...</Text>
            </View>
        );
    }

    // (Si ya está todo listo, procedemos a dibujar la pantalla completa)
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            // (Permite actualizar los cupones si jalas la pantalla para abajo)
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarCuponesOperador}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* El encabezado con el botón para regresar */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.topBackButton} onPress={() => router.back()} activeOpacity={0.85}>
                    <Ionicons name="arrow-back" size={24} color="#00E676" />
                    <Text style={styles.topBackText}>Volver</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Agregar pago</Text>
                <Text style={styles.subtitle}>
                    Ingresa los datos del consumo y genera un QR para que el cliente lo escanee.
                </Text>
            </View>

            {/* Este pedazo de código decide si mostrar el formulario o mostrar el QR gigante */}
            {/* Si no hay pagoGenerado, mostramos el formulario */}
            {!pagoGenerado ? (
                <View style={styles.card}>
                    {/* Caja de texto para poner cuánta plata cargó de gasolina */}
                    <Text style={styles.label}>Valor a pagar</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 20.00"
                        placeholderTextColor="#6B7280"
                        value={valor}
                        onChangeText={setValor}
                        // (Teclado especial con puntito para decimales)
                        keyboardType="decimal-pad"
                    />

                    {/* Botoneras para elegir con qué va a pagar el cliente */}
                    <Text style={styles.label}>Método de pago del cliente</Text>

                    <View style={styles.methodRow}>
                        {/* (Recorremos las 3 opciones de pago y creamos un botón por cada una) */}
                        {(['tarjeta_qruta', 'credito', 'debito'] as MetodoPagoCliente[]).map((metodo) => {
                            // (Verificamos cuál botón está presionado actualmente)
                            const activo = metodoPago === metodo;

                            return (
                                <TouchableOpacity
                                    key={metodo}
                                    style={[
                                        styles.methodButton,
                                        activo && styles.methodButtonActive,
                                    ]}
                                    // (Le decimos al cerebro que guarde la opción elegida)
                                    onPress={() => setMetodoPago(metodo)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.methodText,
                                            activo && styles.methodTextActive,
                                        ]}
                                    >
                                        {/* (Ponemos nombres bonitos en vez de los códigos feos de la base de datos) */}
                                        {metodo === 'tarjeta_qruta'
                                            ? 'Q-Ruta'
                                            : metodo === 'credito'
                                                ? 'Crédito'
                                                : 'Débito'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Botoneras para elegir qué tipo de gasolina le echaron al carro */}
                    <Text style={styles.label}>Tipo de gasolina</Text>

                    <View style={styles.gasGrid}>
                        {/* (Recorremos los 4 tipos de gasolina y hacemos un botón por cada una) */}
                        {(['extra', 'super', 'diesel', 'ecopais'] as TipoGasolina[]).map((tipo) => {
                            const activo = tipoGasolina === tipo;

                            return (
                                <TouchableOpacity
                                    key={tipo}
                                    style={[
                                        styles.gasButton,
                                        activo && styles.methodButtonActive,
                                    ]}
                                    onPress={() => setTipoGasolina(tipo)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.methodText,
                                            activo && styles.methodTextActive,
                                        ]}
                                    >
                                        {/* (Convertimos las palabras a MAYÚSCULAS) */}
                                        {tipo.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Sección para aplicar un cupón al pago */}
                    <Text style={styles.label}>Cupón del operador</Text>

                    {/* Botón por defecto para no aplicar ningún cupón */}
                    <TouchableOpacity
                        style={[
                            styles.couponCard,
                            // (Si no hay ninguno elegido, se marca este como activo)
                            !cuponSeleccionado && styles.couponCardActive,
                        ]}
                        // (Si le pican, le decimos al cerebro que borre el cupón actual)
                        onPress={() => setCuponSeleccionado(null)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.couponCode}>Sin cupón</Text>
                        <Text style={styles.couponText}>
                            Generar pago sin descuento.
                        </Text>
                    </TouchableOpacity>

                    {/* Si no tiene cupones guardados, le avisamos */}
                    {cupones.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No tienes cupones disponibles.
                        </Text>
                    ) : (
                        // (Si sí tiene, listamos todos los cupones que tenga disponibles para usar)
                        cupones.map((cupon) => {
                            const activo = cuponSeleccionado?.id === cupon.id;

                            return (
                                <TouchableOpacity
                                    key={cupon.id}
                                    style={[
                                        styles.couponCard,
                                        activo && styles.couponCardActive,
                                    ]}
                                    onPress={() => setCuponSeleccionado(cupon)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.couponCode}>{cupon.codigo}</Text>

                                    <Text style={styles.couponText}>
                                        {cupon.tipo_descuento === 'porcentaje'
                                            ? `${cupon.valor_descuento}% de descuento`
                                            : `$${Number(cupon.valor_descuento).toFixed(2)} de descuento`}
                                    </Text>

                                    <Text style={styles.couponSmall}>
                                        Cupón único del operador
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {/* El cuadrito gris abajo del todo que te suma y te resta plata en tiempo real */}
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>
                                {/* (Convertimos las comas que pongan los despistados en puntos para no romper las matemáticas) */}
                                ${Number(valor.replace(',', '.') || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Descuento</Text>
                            <Text style={styles.summaryDiscount}>
                                -${descuentoCalculado.toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total a cobrar</Text>
                            <Text style={styles.summaryTotal}>
                                ${totalCalculado.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Botón final para pedirle al servidor que nos genere la intención de cobro */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={generarPagoQr}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0B132B" />
                        ) : (
                            <Text style={styles.buttonText}>Generar QR</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                // SI EL PAGO YA SE GENERÓ, ESCONDEMOS EL FORMULARIO Y MOSTRAMOS ESTO
                <View style={styles.card}>
                    <Text style={styles.qrTitle}>QR generado</Text>
                    <Text style={styles.qrSubtitle}>
                        El cliente debe escanear este código desde “Pagar con QR”.
                    </Text>

                    {/* La caja blanca mágica donde aparece dibujado el QR */}
                    <View style={styles.qrBox}>
                        <QRCode value={qrValue} size={230} />
                    </View>

                    {/* Una factura chiquita resumiendo lo que se acaba de crear */}
                    <View style={styles.detailBox}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Valor</Text>
                            <Text style={styles.detailValue}>
                                ${Number(pagoGenerado.valor).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Descuento</Text>
                            <Text style={styles.detailValue}>
                                ${Number(pagoGenerado.descuento).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Total</Text>
                            <Text style={styles.detailTotal}>
                                ${Number(pagoGenerado.total).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gasolina</Text>
                            <Text style={styles.detailValue}>
                                {pagoGenerado.tipo_gasolina}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Método</Text>
                            <Text style={styles.detailValue}>
                                {pagoGenerado.metodo_pago}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Estado</Text>
                            <Text style={styles.detailValue}>
                                {pagoGenerado.estado}
                            </Text>
                        </View>
                    </View>

                    {/* Mostramos las letricas raras de seguridad para que se vean hackers */}
                    <Text style={styles.tokenText}>
                        Token: {pagoGenerado.qr_token}
                    </Text>

                    {/* Botón para reiniciar toda la pantalla y empezar un cobro nuevo desde cero */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={crearOtroPago}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>Crear otro pago</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas generarPagoQr el botón principal no hará nada y el QR gigante nunca va a aparecer en la pantalla)
(si quitas crearOtroPago los gasolineros se quedarán atrapados viendo el mismo QR para siempre y no podrán cobrarle a los siguientes carros)
*/