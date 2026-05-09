import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRequireRole } from '../../hooks/useRequireRole';
import {
    useAgregarPago,
    MetodoPagoCliente,
    TipoGasolina,
} from '../../hooks/OperadorHooks/UseAgregarPago';
import { styles } from '../_styles/OperadorStyles/AgregarPagoStyles';

export default function AgregarPago() {
    useRequireRole('operador');

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

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando datos del operador...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarCuponesOperador}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
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

            {!pagoGenerado ? (
                <View style={styles.card}>
                    <Text style={styles.label}>Valor a pagar</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 20.00"
                        placeholderTextColor="#6B7280"
                        value={valor}
                        onChangeText={setValor}
                        keyboardType="decimal-pad"
                    />

                    <Text style={styles.label}>Método de pago del cliente</Text>

                    <View style={styles.methodRow}>
                        {(['tarjeta_qruta', 'credito', 'debito'] as MetodoPagoCliente[]).map((metodo) => {
                            const activo = metodoPago === metodo;

                            return (
                                <TouchableOpacity
                                    key={metodo}
                                    style={[
                                        styles.methodButton,
                                        activo && styles.methodButtonActive,
                                    ]}
                                    onPress={() => setMetodoPago(metodo)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.methodText,
                                            activo && styles.methodTextActive,
                                        ]}
                                    >
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

                    <Text style={styles.label}>Tipo de gasolina</Text>

                    <View style={styles.gasGrid}>
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
                                        {tipo.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.label}>Cupón del operador</Text>

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
                            Generar pago sin descuento.
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

                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>
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
                <View style={styles.card}>
                    <Text style={styles.qrTitle}>QR generado</Text>
                    <Text style={styles.qrSubtitle}>
                        El cliente debe escanear este código desde “Pagar con QR”.
                    </Text>

                    <View style={styles.qrBox}>
                        <QRCode value={qrValue} size={230} />
                    </View>

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

                    <Text style={styles.tokenText}>
                        Token: {pagoGenerado.qr_token}
                    </Text>

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