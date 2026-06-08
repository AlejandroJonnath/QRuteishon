import { StyleSheet } from 'react-native';

export const cardsStyles = StyleSheet.create({
    // (Grillas y Tarjetas del Home)
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#0B132B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },

    // (Tarjeta principal gigante)
    bigStatCard: {
        backgroundColor: '#00E676',
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    bigStatLabel: {
        fontSize: 15,
        color: '#050B14',
        fontWeight: '600',
        marginBottom: 4,
    },
    bigStatNumber: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#050B14',
    },
    bigIconBox: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 16,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

