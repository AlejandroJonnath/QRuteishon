import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../_styles/AdminStyles/administradorStyles';
import { useAdministradorLogic } from '../../hooks/AdminHooks/useAdministradorLogic';

export default function AdminPanel() {
    const { perfil, loading, handleLogout } = useAdministradorLogic();

    if (loading || !perfil) {
        return (
            <View style={styles.container}>
                <Text>Cargando panel...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel Administrador</Text>
            <Text style={styles.text}>Bienvenido, {perfil.usuario}</Text>
            <Text>Aquí vamos a tener las estadísticas, las gráficas y el crud para los operadores</Text>

            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logout}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    );
}