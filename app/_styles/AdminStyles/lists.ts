import { StyleSheet } from 'react-native';

export const listStyles = StyleSheet.create({
    // (Listados y CRUD)
    card: {
        backgroundColor: '#0B132B',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
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
    },
    cardMuted: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '600',
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    clearText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 14,
    },

    // (Items de la lista)
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    listText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    listActions: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    statusActivo: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        color: '#00E676',
    },
    statusInactivo: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#EF4444',
    },
    editText: {
        fontSize: 14,
        color: '#00E676',
        fontWeight: '600',
    },
});
