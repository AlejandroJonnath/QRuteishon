import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

export const layoutStyles = StyleSheet.create({
    // (Layout base)
    container: {
        flex: 1,
        backgroundColor: '#050B14',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: isSmall ? 16 : 24,
        paddingTop: 20,
        paddingBottom: 48,
    },

    // (Cabeceras)
    header: {
        marginBottom: 20,
        marginTop: 8,
    },
    greeting: {
        fontSize: 16,
        color: '#00E676',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: isSmall ? 28 : 34,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: isSmall ? 13 : 15,
        color: '#9CA3AF',
        lineHeight: 22,
    },

    // (Textos generales)
    text: {
        fontSize: 16,
        color: '#D1D5DB',
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 10,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#00E676',
        fontWeight: '500',
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

