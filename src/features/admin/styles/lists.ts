import { StyleSheet } from 'react-native';

export const listStyles = StyleSheet.create({
    // (Tarjeta contenedora de listas)
    card: {
        backgroundColor: '#0B132B',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
        paddingBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    cardMuted: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '700',
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        overflow: 'hidden',
    },
    clearText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 14,
        padding: 8,
    },

    // (Items de la lista)
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(30, 41, 59, 0.8)',
        flexWrap: 'wrap',
        gap: 12,
    },
    listContent: {
        flex: 1,
        minWidth: 200,
    },
    listTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: 0.1,
    },
    listText: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
    },
    listActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: '800',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        overflow: 'hidden',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    statusActivo: {
        backgroundColor: 'rgba(0, 230, 118, 0.15)',
        color: '#00E676',
    },
    statusInactivo: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#EF4444',
    },
    editText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
        padding: 8,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
