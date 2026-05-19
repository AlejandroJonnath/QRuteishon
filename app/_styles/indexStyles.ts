import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // (Fondo oscuro que ocupa toda la pantalla mientras se redirige al usuario)
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B132B',
    },
    // (Spinner verde centrado en pantalla — sin posición absoluta)
    loadingContainer: {
        alignItems: 'center',
    },
    // (Texto gris debajo del spinner)
    text: {
        marginTop: 16,
        fontSize: 15,
        color: '#9CA3AF',
        fontWeight: '500',
        letterSpacing: 0.5,
    }
});


// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
