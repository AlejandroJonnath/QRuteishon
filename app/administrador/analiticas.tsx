import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useAdminAnaliticas } from '../../hooks/AdminHooks/useAdminAnaliticas';
import { styles } from '../_styles/AdminStyles';

export default function AdminAnaliticas() {
    useRequireRole('admin');

    const {
        pagos,
        recargas,
        ingresosPagos,
        ingresosRecargas,
        loadingData,
        cargarAnaliticas,
    } = useAdminAnaliticas();

    const [paginaPagos, setPaginaPagos] = useState(1);
    const [paginaRecargas, setPaginaRecargas] = useState(1);
    const registrosPorPagina = 5;

    const totalPaginasPagos = Math.ceil(pagos.length / registrosPorPagina) || 1;
    const indiceUltimoPago = paginaPagos * registrosPorPagina;
    const indicePrimeroPago = indiceUltimoPago - registrosPorPagina;
    const pagosPaginados = pagos.slice(indicePrimeroPago, indiceUltimoPago);

    const totalPaginasRecargas = Math.ceil(recargas.length / registrosPorPagina) || 1;
    const indiceUltimaRecarga = paginaRecargas * registrosPorPagina;
    const indicePrimeraRecarga = indiceUltimaRecarga - registrosPorPagina;
    const recargasPaginadas = recargas.slice(indicePrimeraRecarga, indiceUltimaRecarga);

    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Calculando ingresos...</Text>
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
                    onRefresh={cargarAnaliticas}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>Analíticas y Reportes</Text>
                <Text style={styles.subtitle}>
                    Revisa el volumen de ventas y transacciones de las gasolineras.
                </Text>
            </View>

            <View style={styles.bigStatCard}>
                <View>
                    <Text style={styles.bigStatLabel}>Ingresos por Pagos</Text>
                    <Text style={styles.bigStatNumber}>${ingresosPagos.toFixed(2)}</Text>
                </View>
                <View style={styles.bigIconBox}>
                    <Ionicons name="cash-outline" size={34} color="#050B14" />
                </View>
            </View>

            <View style={[styles.bigStatCard, { backgroundColor: '#1E293B', shadowColor: 'transparent' }]}>
                <View>
                    <Text style={[styles.bigStatLabel, { color: '#9CA3AF' }]}>Dinero Recargado en Billeteras</Text>
                    <Text style={[styles.bigStatNumber, { color: '#FFFFFF' }]}>${ingresosRecargas.toFixed(2)}</Text>
                </View>
                <View style={[styles.bigIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
                    <Ionicons name="wallet-outline" size={34} color="#00E676" />
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Últimos Pagos</Text>
                    <Text style={styles.cardMuted}>{pagos.length}</Text>
                </View>

                {pagos.length === 0 ? (
                    <Text style={styles.emptyText}>No hay pagos registrados recientes.</Text>
                ) : (
                    <>
                        {pagosPaginados.map((pago) => (
                            <View key={pago.id} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>Gasolina {pago.tipo_gasolina.toUpperCase()}</Text>
                                    <Text style={styles.listText}>
                                        ID: {pago.id.split('-')[0]}...
                                    </Text>
                                </View>
                                <View style={styles.listActions}>
                                    <Text style={styles.listTitle}>${pago.total.toFixed(2)}</Text>
                                    <Text style={styles.listText}>
                                        {new Date(pago.pagado_en).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaPagos === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaPagos(Math.max(1, paginaPagos - 1))}
                                disabled={paginaPagos === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.paginationText}>
                                Página {paginaPagos} de {totalPaginasPagos}
                            </Text>
                            
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaPagos === totalPaginasPagos && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaPagos(Math.min(totalPaginasPagos, paginaPagos + 1))}
                                disabled={paginaPagos === totalPaginasPagos}
                            >
                                <Text style={styles.paginationButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Últimas Recargas</Text>
                    <Text style={styles.cardMuted}>{recargas.length}</Text>
                </View>

                {recargas.length === 0 ? (
                    <Text style={styles.emptyText}>No hay recargas registradas recientes.</Text>
                ) : (
                    <>
                        {recargasPaginadas.map((recarga) => (
                            <View key={recarga.id} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle}>Recarga por {recarga.metodo}</Text>
                                    <Text style={styles.listText}>
                                        ID: {recarga.id.split('-')[0]}...
                                    </Text>
                                </View>
                                <View style={styles.listActions}>
                                    <Text style={[styles.listTitle, { color: '#00E676' }]}>
                                        +${recarga.monto.toFixed(2)}
                                    </Text>
                                    <Text style={styles.listText}>
                                        {new Date(recarga.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaRecargas === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaRecargas(Math.max(1, paginaRecargas - 1))}
                                disabled={paginaRecargas === 1}
                            >
                                <Text style={styles.paginationButtonText}>Anterior</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.paginationText}>
                                Página {paginaRecargas} de {totalPaginasRecargas}
                            </Text>
                            
                            <TouchableOpacity
                                style={[styles.paginationButton, paginaRecargas === totalPaginasRecargas && styles.paginationButtonDisabled]}
                                onPress={() => setPaginaRecargas(Math.min(totalPaginasRecargas, paginaRecargas + 1))}
                                disabled={paginaRecargas === totalPaginasRecargas}
                            >
                                <Text style={styles.paginationButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
