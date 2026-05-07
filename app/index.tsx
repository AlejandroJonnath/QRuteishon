import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './_styles/indexStyles';
import { useIndexLogic } from '../hooks/useIndexLogic';

export default function Index() {
    // Toda la lógica de redirección está encapsulada en este hook
    useIndexLogic();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

            {/* Elementos decorativos de fondo */}
            <View style={styles.backgroundGlowTop} />
            <View style={styles.backgroundGlowBottom} />

            <Animated.View
                entering={FadeInDown.duration(1000).springify().damping(12)}
                style={styles.logoContainer}
            >
                <Ionicons name="qr-code-outline" size={72} color="#00E676" style={styles.icon} />
                <Text style={styles.logoText}>Q-Ruta</Text>
            </Animated.View>

            <Animated.View
                entering={FadeIn.delay(600).duration(800)}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color="#00E676" />
                <Text style={styles.text}>Preparando tu ruta...</Text>
            </Animated.View>
        </View>
    );
}