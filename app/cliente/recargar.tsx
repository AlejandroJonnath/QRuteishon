import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useRecarga, MONTO_MAXIMO_RECARGA } from '../../hooks/ClienteHooks/UseRecarga';
import { styles } from '../_styles/ClienteStyles/RecargarStyles';

export default function RecargarSaldo() {
    useRequireRole('cliente');

    const {
        monto,
        setMonto,
        loading,
        loadingData,

        metodosPago,
        metodoPagoSeleccionado,
        setMetodoPagoSeleccionado,

        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,

        descuentoCupon,
        totalSimuladoAPagar,

        cargarDatosRecarga,
        handleRecargar,
    } = useRecarga();

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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={loadingData}
                        onRefresh={cargarDatosRecarga}
                        tintColor="#00E676"
                        colors={['#00E676']}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Recargar saldo</Text>
                    <Text style={styles.text}>
                        Selecciona una tarjeta activa y canjea un cupón si tienes disponible.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Monto a recargar</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 25.00"
                        placeholderTextColor="#6B7280"
                        value={monto}
                        onChangeText={setMonto}
                        keyboardType="decimal-pad"
                    />

                    <Text style={styles.limitText}>
                        Monto máximo permitido: ${MONTO_MAXIMO_RECARGA.toFixed(2)}
                    </Text>

                    <Text style={styles.label}>Tarjeta de crédito o débito</Text>

                    {metodosPago.length === 0 ? (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>
                                No tienes tarjetas activas
                            </Text>

                            <Text style={styles.warningText}>
                                Para recargar, primero debes agregar una tarjeta simulada de crédito o débito.
                            </Text>

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
                        metodosPago.map((tarjeta) => {
                            const activa = metodoPagoSeleccionado?.id === tarjeta.id;

                            return (
                                <TouchableOpacity
                                    key={tarjeta.id}
                                    style={[
                                        styles.paymentCard,
                                        activa && styles.paymentCardActive,
                                    ]}
                                    onPress={() => setMetodoPagoSeleccionado(tarjeta)}
                                    activeOpacity={0.85}
                                >
                                    <View>
                                        <Text
                                            style={[
                                                styles.paymentTitle,
                                                activa && styles.paymentTitleActive,
                                            ]}
                                        >
                                            {tarjeta.tipo === 'credito' ? 'Crédito' : 'Débito'} · {tarjeta.marca || 'Tarjeta'}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.paymentText,
                                                activa && styles.paymentTextActive,
                                            ]}
                                        >
                                            **** **** **** {tarjeta.ultimos_4}
                                        </Text>
                                    </View>

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

                    <Text style={styles.label}>Cupones para canjear</Text>

                    <TouchableOpacity
                        style={[
                            styles.couponCard,
                            !cuponSeleccionado && styles.couponCardActive,
                        ]}
                        onPress={() => setCuponSeleccionado(null)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.couponCode}>Sin cupón</Text>
                        <Text style={styles.couponText}>
                            Recargar sin aplicar descuento.
                        </Text>
                    </TouchableOpacity>

                    {cupones.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No tienes cupones disponibles.
                        </Text>
                    ) : (
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
                                    <Text style={styles.couponCode}>
                                        {cupon.codigo}
                                    </Text>

                                    <Text style={styles.couponText}>
                                        {cupon.tipo_descuento === 'porcentaje'
                                            ? `${cupon.valor_descuento}% de descuento simulado`
                                            : `$${Number(cupon.valor_descuento).toFixed(2)} de descuento simulado`}
                                    </Text>

                                    <Text style={styles.couponSmall}>
                                        Código único y de un solo uso
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Descuento simulado
                            </Text>

                            <Text style={styles.summaryValue}>
                                -${descuentoCupon.toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Total simulado a pagar
                            </Text>

                            <Text style={styles.summaryTotal}>
                                ${totalSimuladoAPagar.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRecargar}
                        disabled={loading || metodosPago.length === 0}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0B132B" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Confirmar recarga
                            </Text>
                        )}
                    </TouchableOpacity>

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