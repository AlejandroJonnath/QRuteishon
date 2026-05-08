import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useRecarga, MONTO_MAXIMO_RECARGA } from '../../hooks/UseRecarga';
import { styles } from '../_styles/RecargarStyles';

export default function RecargarSaldo() {
    useRequireRole('cliente');

    const {
        monto,
        setMonto,
        metodo,
        setMetodo,
        loading,
        handleRecargar,
    } = useRecarga();

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Recargar saldo</Text>
                <Text style={styles.text}>
                    Recarga tu tarjeta Q-Ruta con un método simulado.
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

                <Text style={styles.label}>Método simulado</Text>

                <View style={styles.methodRow}>
                    <TouchableOpacity
                        style={[
                            styles.methodButton,
                            metodo === 'credito' && styles.methodButtonActive,
                        ]}
                        onPress={() => setMetodo('credito')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.methodText,
                                metodo === 'credito' && styles.methodTextActive,
                            ]}
                        >
                            Crédito
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.methodButton,
                            metodo === 'debito' && styles.methodButtonActive,
                        ]}
                        onPress={() => setMetodo('debito')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.methodText,
                                metodo === 'debito' && styles.methodTextActive,
                            ]}
                        >
                            Débito
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRecargar}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>Confirmar recarga</Text>
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
        </KeyboardAvoidingView>
    );
}