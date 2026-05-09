import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useFacturaOperador } from '../../hooks/OperadorHooks/UseFacturaOperador';
import { styles } from '../_styles/OperadorStyles/FacturaOperadorStyles';

export default function GenerarFactura() {
    useRequireRole('operador');

    const {
        pagos,
        pagoSeleccionado,

        cedula,
        setCedula,

        nombre,
        setNombre,

        apellido,
        setApellido,

        telefono,
        setTelefono,

        correo,
        setCorreo,

        loadingData,
        loadingFactura,

        cargarPagosAprobados,
        seleccionarPago,
        generarFactura,
    } = useFacturaOperador();

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando pagos aprobados...</Text>
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
                    onRefresh={cargarPagosAprobados}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>Generar factura</Text>
                <Text style={styles.subtitle}>
                    Selecciona un pago aprobado y completa los datos del cliente.
                </Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Pagos aprobados</Text>
                    <Text style={styles.cardMuted}>{pagos.length}</Text>
                </View>

                {pagos.length === 0 ? (
                    <Text style={styles.emptyText}>
                        Aún no tienes pagos aprobados para facturar.
                    </Text>
                ) : (
                    pagos.map((pago) => {
                        const activo = pagoSeleccionado?.id === pago.id;

                        return (
                            <TouchableOpacity
                                key={pago.id}
                                style={[
                                    styles.paymentItem,
                                    activo && styles.paymentItemActive,
                                ]}
                                onPress={() => seleccionarPago(pago)}
                                activeOpacity={0.85}
                            >
                                <View>
                                    <Text
                                        style={[
                                            styles.paymentTitle,
                                            activo && styles.paymentTitleActive,
                                        ]}
                                    >
                                        ${Number(pago.total).toFixed(2)} · {pago.tipo_gasolina}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.paymentText,
                                            activo && styles.paymentTextActive,
                                        ]}
                                    >
                                        Método: {pago.metodo_pago}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.paymentText,
                                            activo && styles.paymentTextActive,
                                        ]}
                                    >
                                        Fecha: {pago.pagado_en ? new Date(pago.pagado_en).toLocaleString() : 'Sin fecha'}
                                    </Text>
                                </View>

                                <Text
                                    style={[
                                        styles.paymentBadge,
                                        activo && styles.paymentBadgeActive,
                                    ]}
                                >
                                    {activo ? 'Seleccionado' : 'Elegir'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            {pagoSeleccionado && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Datos de facturación</Text>

                    <Text style={styles.label}>Cédula</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 1312345678"
                        placeholderTextColor="#6B7280"
                        value={cedula}
                        onChangeText={setCedula}
                        keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: Jonnath"
                        placeholderTextColor="#6B7280"
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    <Text style={styles.label}>Apellido</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: Cedeño"
                        placeholderTextColor="#6B7280"
                        value={apellido}
                        onChangeText={setApellido}
                    />

                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: +593 0999999999"
                        placeholderTextColor="#6B7280"
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Correo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="cliente@correo.com"
                        placeholderTextColor="#6B7280"
                        value={correo}
                        onChangeText={setCorreo}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>
                                ${Number(pagoSeleccionado.valor).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Descuento</Text>
                            <Text style={styles.summaryDiscount}>
                                -${Number(pagoSeleccionado.descuento).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total</Text>
                            <Text style={styles.summaryTotal}>
                                ${Number(pagoSeleccionado.total).toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loadingFactura && styles.buttonDisabled]}
                        onPress={generarFactura}
                        disabled={loadingFactura}
                        activeOpacity={0.85}
                    >
                        {loadingFactura ? (
                            <ActivityIndicator color="#0B132B" />
                        ) : (
                            <Text style={styles.buttonText}>Generar factura</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}