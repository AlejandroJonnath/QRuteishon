import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(11, 19, 43, 0.85)', // Dark blue background with transparency
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.95)',
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainerSuccess: {
        backgroundColor: 'rgba(0, 230, 118, 0.15)', // #00E676
    },
    iconContainerError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)', // #EF4444
    },
    iconContainerWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)', // #F59E0B
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonsContainer: {
        width: '100%',
        gap: 12,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDefault: {
        backgroundColor: '#00E676',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonCancel: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonDestructive: {
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    buttonTextDefault: {
        color: '#0B132B',
    },
    buttonTextCancel: {
        color: '#D1D5DB',
    },
    buttonTextDestructive: {
        color: '#FFFFFF',
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

