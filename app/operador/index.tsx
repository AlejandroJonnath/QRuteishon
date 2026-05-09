import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useOperadorLogic } from '../../hooks/OperadorHooks/useOperadorLogic';
import { styles } from '../_styles/OperadorStyles/operadorStyles';

export default function OperadorPanel() {
    const { loading } = useRequireRole('operador');

    const {
        perfil,
        handleLogout,
        irAgregarPago,
        irHistorialCupones,
        irGenerarFactura,
    } = useOperadorLogic();

    if (loading || !perfil) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando panel...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hola, {perfil.usuario}</Text>
                <Text style={styles.title}>Panel Operador</Text>
                <Text style={styles.subtitle}>
                    Genera pagos QR, administra cupones y emite facturas simuladas.
                </Text>
            </View>

            <View style={styles.mainCard}>
                <View style={styles.mainIconBox}>
                    <Ionicons name="qr-code-outline" size={42} color="#0B132B" />
                </View>

                <Text style={styles.mainTitle}>Cobro con QR</Text>
                <Text style={styles.mainText}>
                    Crea un pago para que el cliente lo escanee desde su app QRuta.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={irAgregarPago}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryButtonText}>
                        Agregar pago y generar QR
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionGrid}>
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={irHistorialCupones}
                    activeOpacity={0.85}
                >
                    <Ionicons name="ticket-outline" size={30} color="#00E676" />
                    <Text style={styles.optionTitle}>Historial de cupones</Text>
                    <Text style={styles.optionText}>
                        Consulta los cupones disponibles o usados.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={irGenerarFactura}
                    activeOpacity={0.85}
                >
                    <Ionicons name="document-text-outline" size={30} color="#00E676" />
                    <Text style={styles.optionTitle}>Generar factura</Text>
                    <Text style={styles.optionText}>
                        Emite una factura simulada con datos del cliente.
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Datos del operador</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Usuario</Text>
                    <Text style={styles.infoValue}>{perfil.usuario}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Rol</Text>
                    <Text style={styles.infoValue}>{perfil.rol}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado</Text>
                    <Text style={styles.infoValue}>{perfil.estado}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.85}
            >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}