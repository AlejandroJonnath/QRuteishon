// Importamos View para el contenedor principal de la pantalla
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
// Importamos Animated para aplicar animaciones de entrada y FadeIn/FadeInDown para los efectos visuales
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
// Importamos Ionicons para mostrar el ícono del logo QR
import { Ionicons } from '@expo/vector-icons';
// Importamos los estilos de esta pantalla
import { styles } from './_styles/indexStyles';
// Importamos el hook que se encarga de verificar sesión y redirigir al usuario al área correcta
import { useIndexLogic } from '../hooks/useIndexLogic';

// Sección
// Este archivo es la pantalla de bienvenida que aparece mientras la app verifica si hay sesión activa
// No tiene interacción real con el usuario, simplemente muestra el logo con una animación y un spinner
// mientras el hook useIndexLogic decide a dónde redirigir al usuario (login, cliente, operador, admin)

// Funciones
// Index: Componente que dibuja la pantalla de splash (bienvenida) mientras se decide la redirección

export default function Index() {
    // (Llamamos al hook que hace toda la lógica de redirección en segundo plano)
    // (No devuelve nada visible, solo hace su trabajo y manda al usuario al lugar correcto)
    useIndexLogic();

    return (
        // (Contenedor principal negro azulado que ocupa toda la pantalla)
        <View style={styles.container}>
            {/* Configuramos la barra de estado del sistema (la de la hora y la batería) con texto blanco */}
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

            {/* Círculo brillante decorativo en la parte superior del fondo para darle profundidad al diseño */}
            <View style={styles.backgroundGlowTop} />
            {/* Círculo brillante decorativo en la parte inferior del fondo */}
            <View style={styles.backgroundGlowBottom} />

            {/* Contenedor del logo que entra con una animación de rebote desde abajo */}
            <Animated.View
                // (El logo cae desde abajo, dura 1 segundo y tiene efecto de resorte con amortiguación 12)
                entering={FadeInDown.duration(1000).springify().damping(12)}
                style={styles.logoContainer}
            >
                {/* Ícono de código QR en verde neón, tamaño grande de 72 puntos */}
                <Ionicons name="qr-code-outline" size={72} color="#00E676" style={styles.icon} />
                {/* Nombre de la app debajo del ícono */}
                <Text style={styles.logoText}>Q-Ruta</Text>
            </Animated.View>

            {/* Contenedor del spinner de carga que aparece después del logo con un pequeño retraso */}
            <Animated.View
                // (Aparece con fundido simple después de 600 milisegundos para no aparecer al mismo tiempo que el logo)
                entering={FadeIn.delay(600).duration(800)}
                style={styles.loadingContainer}
            >
                {/* Ruedita verde girando que indica que la app está trabajando en segundo plano */}
                <ActivityIndicator size="large" color="#00E676" />
                {/* Texto debajo del spinner que le dice al usuario que espere */}
                <Text style={styles.text}>Preparando tu ruta...</Text>
            </Animated.View>
        </View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas Index la app no tendrá punto de entrada y fallará al intentar cargar por primera vez)
(si quitas useIndexLogic el usuario quedará atrapado en la pantalla de carga para siempre porque nadie decidirá a dónde redirigirlo)
*/