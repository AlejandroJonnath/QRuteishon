import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

export const buttonStyles = StyleSheet.create({
    // (Botones de menú estilo tarjeta)
    optionCard: {
        backgroundColor: '#0B132B',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    optionContent: {
        flex: 1,
        marginLeft: 16,
        marginRight: 12,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    optionCardText: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
    },

    // (Botones Selector)
    optionButton: {
        flex: 1,
        paddingVertical: isSmall ? 10 : 12,
        backgroundColor: '#050B14',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 3,
    },
    optionButtonActive: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        borderColor: '#00E676',
    },
    optionText: {
        color: '#9CA3AF',
        fontWeight: '600',
        fontSize: isSmall ? 13 : 14,
    },
    optionTextActive: {
        color: '#00E676',
    },

    // (Botones de acción principal)
    button: {
        backgroundColor: '#00E676',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 12,
    },
    buttonDisabled: {
        backgroundColor: '#00E67680',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#0B132B',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondaryButtonFull: {
        backgroundColor: '#1E293B',
        paddingVertical: isSmall ? 14 : 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    secondaryButtonFullText: {
        color: '#FFFFFF',
        fontSize: isSmall ? 14 : 15,
        fontWeight: '600',
    },

    // (Navegación / Salir)
    logoutButton: {
        marginTop: 8,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    backText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },
});

// Expo Router requires a default export on every file inside the app/ directory.
// This no-op export silences the "missing default export" route warning.
export default function DummyRoute() { return null; }
