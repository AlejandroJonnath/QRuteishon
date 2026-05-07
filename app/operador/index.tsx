import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../_styles/operadorStyles';
import { useOperadorLogic } from '../../hooks/useOperadorLogic';

export default function OperadorPanel() {
    const { perfil, loading, handleLogout } = useOperadorLogic();

    if (loading || !perfil) {
        return (
            <View style={styles.container}>
                <Text>Cargando panel...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel Operador</Text>
            <Text style={styles.text}>Bienvenido, {perfil.usuario}</Text>
            <Text style={styles.text}>Rol: {perfil.rol}</Text>

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Escanear QR</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logout}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}