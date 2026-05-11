import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useAdminHome } from '../../hooks/AdminHooks/useAdminHome';
import { styles } from '../_styles/AdminStyles';

export default function AdminPanel() {
    const { loading } = useRequireRole('admin');

    const {
        perfil,
        totalUsuarios,
        totalClientes,
        totalOperadores,
        totalAdmins,
        totalPagos,
        totalRecargas,
        totalCupones,
        loadingData,
        cargarResumen,
        handleLogout,
        irClientes,
        irOperadores,
        irAdministradores,
        irCupones,
        irAnaliticas,
    } = useAdminHome();

    if (loading || loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando panel administrador...</Text>
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
                    onRefresh={cargarResumen}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hola, {perfil?.usuario || 'Administrador'}</Text>
                <Text style={styles.title}>Panel Administrador</Text>
                <Text style={styles.subtitle}>
                    Control general de perfiles, cupones y analíticas de QRuta.
                </Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Ionicons name="people-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalUsuarios}</Text>
                    <Text style={styles.statLabel}>Total Usuarios</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="person-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalClientes}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="briefcase-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalOperadores}</Text>
                    <Text style={styles.statLabel}>Operadores</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="shield-checkmark-outline" size={26} color="#00E676" />
                    <Text style={styles.statNumber}>{totalAdmins}</Text>
                    <Text style={styles.statLabel}>Admins</Text>
                </View>
            </View>

            <View style={styles.bigStatCard}>
                <View>
                    <Text style={styles.bigStatLabel}>Actividad general</Text>
                    <Text style={styles.bigStatNumber}>{totalPagos + totalRecargas + totalCupones}</Text>
                </View>

                <View style={styles.bigIconBox}>
                    <Ionicons name="analytics-outline" size={34} color="#050B14" />
                </View>
            </View>

            <TouchableOpacity style={styles.optionCard} onPress={irClientes} activeOpacity={0.85}>
                <Ionicons name="person-circle-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de clientes</Text>
                    <Text style={styles.optionCardText}>
                        Registra clientes nuevos, edita datos y cambia sus estados.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={irOperadores} activeOpacity={0.85}>
                <Ionicons name="briefcase-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de operadores</Text>
                    <Text style={styles.optionCardText}>
                        Crea operadores y asígnales una gasolinera para despachar.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={irAdministradores} activeOpacity={0.85}>
                <Ionicons name="shield-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de administradores</Text>
                    <Text style={styles.optionCardText}>
                        Gestiona al equipo administrativo del sistema.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={irCupones} activeOpacity={0.85}>
                <Ionicons name="ticket-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>CRUD de cupones</Text>
                    <Text style={styles.optionCardText}>
                        Genera lotes masivos de cupones y modifícalos.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={irAnaliticas} activeOpacity={0.85}>
                <Ionicons name="bar-chart-outline" size={34} color="#00E676" />
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Analíticas</Text>
                    <Text style={styles.optionCardText}>
                        Revisa pagos y recargas, e ingresos totales recientes.
                    </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}