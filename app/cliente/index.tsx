import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../_styles/clienteStyles';
import { useClienteLogic } from '../../hooks/useClienteLogic';

export default function ClientePanel() {
    const { perfil, loading, handleLogout } = useClienteLogic();

    if (loading || !perfil) {
        return (
            <View style={styles.container}>
                <Text>Cargando panel...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel Cliente</Text>
            <Text style={styles.text}>Bienvenido, {perfil.usuario}</Text>
            <Text style={styles.text}>Rol: {perfil.rol}</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Saldo Q-Ruta</Text>
                <Text style={styles.balance}>$0.00</Text>
            </View>

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Generar QR de pago</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logout}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}