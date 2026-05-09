import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useCuponesOperador } from '../../hooks/OperadorHooks/UseCuponesOperador';
import { styles } from '../_styles/OperadorStyles/CuponesOperadorStyles';

export default function CuponesOperador() {
    useRequireRole('operador');

    const {
        cupones,
        loadingData,
        loadingCrear,
        cargarCupones,
        crearCuponMensual,
    } = useCuponesOperador();

    function obtenerTextoDescuento(tipo: string, valor: number) {
        if (tipo === 'porcentaje') {
            return `${valor}% de descuento`;
        }

        return `$${Number(valor).toFixed(2)} de descuento`;
    }

    function obtenerEstiloEstado(estado: string) {
        if (estado === 'disponible') return styles.statusDisponible;
        if (estado === 'usado') return styles.statusUsado;
        return styles.statusVencido;
    }

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando cupones...</Text>
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
                    onRefresh={cargarCupones}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>Historial de cupones</Text>
                <Text style={styles.subtitle}>
                    Cada operador puede generar un cupón mensual de un solo uso.
                </Text>
            </View>

            <View style={styles.mainCard}>
                <View style={styles.iconBox}>
                    <Ionicons name="ticket-outline" size={34} color="#0B132B" />
                </View>

                <Text style={styles.mainTitle}>Cupón mensual</Text>
                <Text style={styles.mainText}>
                    Este cupón puede aplicarse al generar un pago QR para ofrecer un descuento simulado.
                </Text>

                <TouchableOpacity
                    style={[styles.button, loadingCrear && styles.buttonDisabled]}
                    onPress={crearCuponMensual}
                    disabled={loadingCrear}
                    activeOpacity={0.85}
                >
                    {loadingCrear ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>Crear cupón del mes</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Mis cupones</Text>
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {cupones.length === 0 ? (
                    <Text style={styles.emptyText}>
                        Aún no tienes cupones registrados.
                    </Text>
                ) : (
                    cupones.map((cupon) => (
                        <View key={cupon.id} style={styles.couponItem}>
                            <View style={styles.couponHeader}>
                                <Text style={styles.couponCode}>{cupon.codigo}</Text>

                                <Text style={[styles.statusBadge, obtenerEstiloEstado(cupon.estado)]}>
                                    {cupon.estado}
                                </Text>
                            </View>

                            <Text style={styles.couponText}>
                                {obtenerTextoDescuento(
                                    cupon.tipo_descuento,
                                    Number(cupon.valor_descuento)
                                )}
                            </Text>

                            <Text style={styles.couponSmall}>
                                Uso único: {cupon.uso_unico ? 'Sí' : 'No'}
                            </Text>

                            <Text style={styles.couponSmall}>
                                Expira: {cupon.expira_en ? new Date(cupon.expira_en).toLocaleDateString() : 'Sin fecha'}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}