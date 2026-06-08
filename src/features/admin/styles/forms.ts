import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

export const formStyles = StyleSheet.create({
    // (Formularios)
    label: {
        fontSize: isSmall ? 12 : 13,
        color: '#9CA3AF',
        marginBottom: 6,
        marginTop: isSmall ? 10 : 14,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#050B14',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: isSmall ? 14 : 16,
        // (Área de toque mínima de 48px recomendada por Material Design y Apple HIG)
        paddingVertical: isSmall ? 13 : 15,
        fontSize: isSmall ? 14 : 15,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: isSmall ? 14 : 20,
        gap: 8,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

