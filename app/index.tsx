// Importamos View para el contenedor principal de la pantalla
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
// Importamos los estilos de esta pantalla
import { styles } from './_styles/indexStyles';
// Importamos el hook que se encarga de verificar sesión y redirigir al usuario al área correcta
import { useIndexLogic } from '../hooks/useIndexLogic';

// Sección
// Este archivo es la pantalla intermedia de redirección que aparece brevemente mientras el AuthContext
// termina de cargar la sesión y el perfil. NO es un splash de bienvenida real — el usuario prácticamente
// no la ve. Por eso no tiene animaciones largas: solo un fondo oscuro + spinner verde instantáneo.
// La animación visual de "entrada al módulo" ocurre en cada pantalla de módulo (FadeIn.duration(300)).

// Funciones
// Index: Componente minimalista que muestra el spinner mientras useIndexLogic decide la ruta correcta

export default function Index() {
    // (Llamamos al hook que hace toda la lógica de redirección en segundo plano)
    // (No devuelve nada visible, solo hace su trabajo y manda al usuario al lugar correcto)
    useIndexLogic();

    return (
        // (Contenedor principal oscuro que ocupa toda la pantalla)
        <View style={styles.container}>
            {/* Barra de estado del sistema con texto blanco */}
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

            {/* Spinner verde centrado — aparece instantáneamente, sin delays ni animaciones largas */}
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00E676" />
                <Text style={styles.text}>Cargando...</Text>
            </View>
        </View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas Index la app no tendrá punto de entrada y fallará al intentar cargar por primera vez)
(si quitas useIndexLogic el usuario quedará atrapado en la pantalla de carga para siempre porque nadie decidirá a dónde redirigirlo)
*/