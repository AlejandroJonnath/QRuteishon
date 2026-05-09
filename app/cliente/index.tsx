import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useClienteLogic } from '../../hooks/ClienteHooks/useClienteLogic';
import { styles } from '../_styles/ClienteStyles/clienteStyles';

export default function ClientePanel() {
    const { loading } = useRequireRole('cliente');

    const {
        perfil,
        billetera,
        movimientos,
        cupones,
        loadingData,
        cargarDatosCliente,
        handleLogout,
        irARecargar,
        irAPagarQr,
    } = useClienteLogic();

    if (loading || loadingData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Cargando panel...</Text>
            </View>
        );
    }

    const saldo = Number(billetera?.saldo || 0).toFixed(2);
    const estadoTarjeta = billetera?.estado || 'sin billetera';
    const numeroTarjeta = billetera?.numero_tarjeta || 'Sin tarjeta Q-Ruta';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarDatosCliente}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hola, {perfil?.usuario || 'Cliente'}</Text>
                <Text style={styles.title}>Panel Cliente</Text>
                <Text style={styles.subtitle}>Paga combustible de forma rápida con QRuta.</Text>
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Saldo actual</Text>
                <Text style={styles.balanceAmount}>${saldo}</Text>
                <Text style={styles.balanceFooter}>Disponible para pagos con Tarjeta Q-Ruta</Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={irAPagarQr} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Pagar con QR</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={irARecargar} activeOpacity={0.85}>
                    <Text style={styles.secondaryButtonText}>Recargar saldo</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.fullButton}
                onPress={() => router.push('/cliente/metodos-pagos')}
                activeOpacity={0.85}
            >
                <Ionicons
                    name="card-outline"
                    size={20}
                    color="#FFFFFF"
                    style={styles.fullButtonIcon}
                />
                <Text style={styles.fullButtonText}>Agregar método de pago</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Tarjeta Q-Ruta</Text>
                    <Text style={styles.cardMuted}>Virtual</Text>
                </View>

                <View style={styles.virtualCard}>
                    <View style={styles.virtualCardHeader}>
                        <Ionicons name="card" size={22} color="#00E676" />
                        <Text style={styles.virtualCardTitle}>Q-Ruta</Text>
                    </View>
                    <Text style={styles.qrCardNumber}>{numeroTarjeta}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado</Text>
                    <Text style={styles.infoValue}>{estadoTarjeta}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Saldo de tarjeta</Text>
                    <Text style={styles.infoValue}>${saldo}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Cupones disponibles</Text>
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {cupones.length === 0 ? (
                    <Text style={styles.emptyText}>No tienes cupones disponibles.</Text>
                ) : (
                    cupones.map((cupon) => (
                        <View key={cupon.id} style={styles.couponItem}>
                            <Text style={styles.couponCode}>{cupon.codigo}</Text>
                            <Text style={styles.couponText}>
                                {cupon.tipo_descuento === 'porcentaje'
                                    ? `${cupon.valor_descuento}% de descuento`
                                    : `$${Number(cupon.valor_descuento).toFixed(2)} de descuento`}
                            </Text>
                            <Text style={styles.couponText}>
                                Código único y de un solo uso
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Últimos movimientos</Text>
                    <Text style={styles.cardMuted}>Recientes</Text>
                </View>

                {movimientos.length === 0 ? (
                    <Text style={styles.emptyText}>Aún no tienes movimientos.</Text>
                ) : (
                    movimientos.map((movimiento) => {
                        const monto = Number(movimiento.monto || 0);
                        const esPositivo = monto >= 0;

                        return (
                            <View key={movimiento.id} style={styles.movementItem}>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={styles.movementTitle}>{movimiento.tipo}</Text>
                                    <Text style={styles.movementDescription}>
                                        {movimiento.descripcion || 'Movimiento QRuta'}
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        esPositivo
                                            ? styles.movementAmountPositive
                                            : styles.movementAmountNegative
                                    }
                                >
                                    {esPositivo ? '+' : '-'}${Math.abs(monto).toFixed(2)}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}