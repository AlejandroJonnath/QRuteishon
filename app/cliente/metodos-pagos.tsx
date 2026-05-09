import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useMetodosPagos } from '../../hooks/ClienteHooks/useMetodosPagos';
import { styles } from '../_styles/ClienteStyles/MetodosPagosStyles';

export default function MetodosPagoScreen() {
    useRequireRole('cliente');

    const {
        tipo,
        setTipo,
        marca,
        setMarca,
        ultimos4,
        setUltimos4,
        titular,
        setTitular,
        metodos,
        loading,
        loadingData,
        agregarMetodoPago,
        desactivarMetodo
    } = useMetodosPagos();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.topBackButton} onPress={() => router.back()} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={24} color="#00E676" />
                <Text style={styles.topBackText}>Volver</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Métodos de pago</Text>
            <Text style={styles.subtitle}>
                Agrega tarjetas simuladas de crédito o débito para recargar tu saldo Q-Ruta.
            </Text>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Importante</Text>
                <Text style={styles.infoText}>
                    No guardamos números reales de tarjeta. Solo se registran los últimos 4 dígitos para simulación.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Tipo de tarjeta</Text>

                <View style={styles.row}>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            tipo === 'credito' && styles.optionButtonActive,
                        ]}
                        onPress={() => setTipo('credito')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                tipo === 'credito' && styles.optionTextActive,
                            ]}
                        >
                            Crédito
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            tipo === 'debito' && styles.optionButtonActive,
                        ]}
                        onPress={() => setTipo('debito')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                tipo === 'debito' && styles.optionTextActive,
                            ]}
                        >
                            Débito
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Marca</Text>
                
                <View style={styles.brandGrid}>
                    {['Visa', 'Mastercard', 'Diners', 'Amex', 'Discover'].map((b) => {
                        const activo = marca === b;
                        return (
                            <TouchableOpacity
                                key={b}
                                style={[
                                    styles.brandButton,
                                    activo && styles.brandButtonActive,
                                ]}
                                onPress={() => setMarca(b)}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.brandText,
                                        activo && styles.brandTextActive,
                                    ]}
                                >
                                    {b}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>Últimos 4 dígitos</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ejemplo: 4321"
                    placeholderTextColor="#6B7280"
                    value={ultimos4}
                    onChangeText={setUltimos4}
                    keyboardType="number-pad"
                    maxLength={4}
                />

                <Text style={styles.label}>Titular</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ejemplo: Jonnath Cedeño"
                    placeholderTextColor="#6B7280"
                    value={titular}
                    onChangeText={setTitular}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={agregarMetodoPago}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>Agregar tarjeta</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tarjetas registradas</Text>

                {loadingData ? (
                    <ActivityIndicator color="#00E676" />
                ) : metodos.length === 0 ? (
                    <Text style={styles.emptyText}>
                        Todavía no tienes tarjetas registradas.
                    </Text>
                ) : (
                    metodos.map((metodo) => (
                        <View key={metodo.id} style={styles.paymentCard}>
                            <View>
                                <Text style={styles.paymentTitle}>
                                    {metodo.tipo === 'credito' ? 'Crédito' : 'Débito'} · {metodo.marca || 'Tarjeta'}
                                </Text>
                                <Text style={styles.paymentText}>
                                    **** **** **** {metodo.ultimos_4}
                                </Text>
                                <Text style={styles.paymentText}>
                                    Estado: {metodo.estado}
                                </Text>
                            </View>

                            {metodo.estado === 'activa' && (
                                <TouchableOpacity
                                    style={styles.deactivateButton}
                                    onPress={() => desactivarMetodo(metodo.id)}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.deactivateText}>Desactivar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}