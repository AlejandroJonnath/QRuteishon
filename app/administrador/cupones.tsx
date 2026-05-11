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
import { useAdminCupones } from '../../hooks/AdminHooks/useAdminCupones';
import { styles } from '../_styles/AdminStyles';

export default function AdminCupones() {
    useRequireRole('admin');

    const {
        cupones,
        cantidad,
        setCantidad,
        tipoDescuento,
        setTipoDescuento,
        valorDescuento,
        setValorDescuento,
        diasValidez,
        setDiasValidez,
        loadingData,
        loadingAction,
        cargarCupones,
        generarLoteCupones,
        cambiarEstadoCupon,
    } = useAdminCupones();

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
                <Text style={styles.title}>CRUD de Cupones</Text>
                <Text style={styles.subtitle}>
                    Crea múltiples cupones automáticamente y administra los existentes.
                </Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Generador Automático</Text>
                </View>

                <Text style={styles.label}>Cantidad a generar (Ej: 10)</Text>
                <TextInput 
                    style={styles.input} 
                    value={cantidad} 
                    onChangeText={setCantidad} 
                    placeholder="Número de cupones" 
                    placeholderTextColor="#6B7280" 
                    keyboardType="number-pad" 
                />

                <Text style={styles.label}>Tipo de Descuento</Text>
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.optionButton, tipoDescuento === 'monto' && styles.optionButtonActive]}
                        onPress={() => setTipoDescuento('monto')}
                    >
                        <Text style={[styles.optionText, tipoDescuento === 'monto' && styles.optionTextActive]}>
                            Monto Fijo ($)
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionButton, tipoDescuento === 'porcentaje' && styles.optionButtonActive]}
                        onPress={() => setTipoDescuento('porcentaje')}
                    >
                        <Text style={[styles.optionText, tipoDescuento === 'porcentaje' && styles.optionTextActive]}>
                            Porcentaje (%)
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Valor del Descuento</Text>
                <TextInput 
                    style={styles.input} 
                    value={valorDescuento} 
                    onChangeText={setValorDescuento} 
                    placeholder="Ejemplo: 5" 
                    placeholderTextColor="#6B7280" 
                    keyboardType="numeric" 
                />

                <Text style={styles.label}>Días de Validez</Text>
                <TextInput 
                    style={styles.input} 
                    value={diasValidez} 
                    onChangeText={setDiasValidez} 
                    placeholder="Ejemplo: 30" 
                    placeholderTextColor="#6B7280" 
                    keyboardType="number-pad" 
                />

                <TouchableOpacity
                    style={[styles.button, loadingAction && styles.buttonDisabled]}
                    onPress={generarLoteCupones}
                    disabled={loadingAction}
                >
                    {loadingAction ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>Generar Lote Mágico</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Cupones Globales</Text>
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {cupones.length === 0 ? (
                    <Text style={styles.emptyText}>No hay cupones registrados.</Text>
                ) : (
                    cupones.map((cupon) => (
                        <View key={cupon.id} style={styles.listItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.listTitle}>{cupon.codigo}</Text>
                                <Text style={styles.listText}>
                                    Descuento: {cupon.tipo_descuento === 'monto' ? '$' : ''}{cupon.valor_descuento}{cupon.tipo_descuento === 'porcentaje' ? '%' : ''}
                                </Text>
                                <Text style={styles.listText}>Uso único: {cupon.uso_unico ? 'Sí' : 'No'}</Text>
                            </View>

                            <View style={styles.listActions}>
                                <Text
                                    style={[
                                        styles.statusBadge,
                                        cupon.estado === 'disponible' ? styles.statusActivo : styles.statusInactivo,
                                    ]}
                                >
                                    {cupon.estado}
                                </Text>
                                
                                {cupon.estado === 'disponible' && (
                                    <TouchableOpacity 
                                        onPress={() => cambiarEstadoCupon(cupon.id, 'vencido')}
                                        disabled={loadingAction}
                                    >
                                        <Text style={[styles.editText, { color: '#EF4444' }]}>Anular</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver al panel</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
