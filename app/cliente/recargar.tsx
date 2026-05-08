import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRequireRole } from '../../hooks/useRequireRole';

type MetodoRecarga = 'credito' | 'debito';

const MONTO_MAXIMO_RECARGA = 200;

export default function RecargarSaldo() {
    useRequireRole('cliente');

    const { session } = useAuth();

    const [monto, setMonto] = useState('');
    const [metodo, setMetodo] = useState<MetodoRecarga>('credito');
    const [loading, setLoading] = useState(false);

    function obtenerMontoNumerico() {
        return Number(monto.replace(',', '.'));
    }

    async function handleRecargar() {
        const usuarioId = session?.user?.id;
        const montoNumerico = obtenerMontoNumerico();

        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual.');
            return;
        }

        if (!monto.trim()) {
            Alert.alert('Campo requerido', 'Ingresa el monto que deseas recargar.');
            return;
        }

        if (Number.isNaN(montoNumerico) || montoNumerico <= 0) {
            Alert.alert('Monto inválido', 'Ingresa un monto válido mayor a $0.00.');
            return;
        }

        if (montoNumerico > MONTO_MAXIMO_RECARGA) {
            Alert.alert(
                'Monto excedido',
                `El monto máximo de recarga es $${MONTO_MAXIMO_RECARGA.toFixed(2)}.`
            );
            return;
        }

        try {
            setLoading(true);

            const { data: billetera, error: billeteraError } = await supabase
                .from('billeteras')
                .select('id, saldo, estado')
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (billeteraError) {
                console.log(billeteraError.message);
                Alert.alert('Error', 'No se pudo consultar tu billetera.');
                return;
            }

            if (!billetera) {
                Alert.alert(
                    'Billetera no encontrada',
                    'Tu usuario todavía no tiene una billetera Q-Ruta.'
                );
                return;
            }

            if (billetera.estado !== 'activa') {
                Alert.alert(
                    'Billetera inactiva',
                    'Tu billetera no está activa para recibir recargas.'
                );
                return;
            }

            const saldoActual = Number(billetera.saldo || 0);
            const nuevoSaldo = Number((saldoActual + montoNumerico).toFixed(2));

            const { error: saldoError } = await supabase
                .from('billeteras')
                .update({
                    saldo: nuevoSaldo,
                })
                .eq('id', billetera.id);

            if (saldoError) {
                console.log(saldoError.message);
                Alert.alert('Error', 'No se pudo actualizar el saldo.');
                return;
            }

            const { data: recarga, error: recargaError } = await supabase
                .from('recargas')
                .insert({
                    usuario_id: usuarioId,
                    billetera_id: billetera.id,
                    monto: montoNumerico,
                    metodo,
                    estado: 'aprobada',
                })
                .select('id')
                .single();

            if (recargaError) {
                console.log(recargaError.message);
                Alert.alert(
                    'Recarga aplicada',
                    'El saldo fue actualizado, pero no se pudo guardar el registro de recarga.'
                );
                return;
            }

            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    tipo: 'recarga',
                    descripcion:
                        metodo === 'credito'
                            ? 'Recarga simulada con tarjeta de crédito'
                            : 'Recarga simulada con tarjeta de débito',
                    monto: montoNumerico,
                    estado: 'completado',
                    referencia_id: recarga.id,
                });

            if (movimientoError) {
                console.log(movimientoError.message);
            }

            Alert.alert(
                'Recarga exitosa',
                `Se recargaron $${montoNumerico.toFixed(2)} a tu tarjeta Q-Ruta.`,
                [
                    {
                        text: 'Aceptar',
                        onPress: () => router.replace('/cliente'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al recargar saldo.');
        } finally {
            setLoading(false);
        }
    }

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
                    Monto máximo permitido: $200.00
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
    },
    text: {
        color: '#9CA3AF',
        fontSize: 16,
        lineHeight: 22,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.72)',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    label: {
        color: '#D1D5DB',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        fontSize: 18,
        marginBottom: 10,
    },
    limitText: {
        color: '#00E676',
        fontSize: 13,
        marginBottom: 22,
        fontWeight: '700',
    },
    methodRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    methodButton: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    methodButtonActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    methodText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    methodTextActive: {
        color: '#0B132B',
    },
    button: {
        backgroundColor: '#00E676',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#0B132B',
        fontWeight: '900',
        fontSize: 16,
    },
    backButton: {
        marginTop: 18,
        alignItems: 'center',
    },
    backText: {
        color: '#9CA3AF',
        fontWeight: '800',
    },
});