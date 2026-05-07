import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B132B',
    },
    backgroundGlowTop: {
        position: 'absolute',
        top: -150,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#00E676',
        opacity: 0.08,
    },
    backgroundGlowBottom: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#1E3A8A',
        opacity: 0.12,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    icon: {
        marginBottom: 16,
    },
    logoText: {
        fontSize: 44,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    loadingContainer: {
        alignItems: 'center',
        position: 'absolute',
        bottom: 80,
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '500',
        letterSpacing: 0.5,
    }
});
