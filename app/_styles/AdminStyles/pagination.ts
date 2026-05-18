import { StyleSheet } from 'react-native';

export const paginationStyles = StyleSheet.create({
    // (Paginación)
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    paginationButton: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    paginationButtonDisabled: {
        opacity: 0.5,
    },
    paginationButtonText: {
        color: '#00E676',
        fontWeight: 'bold',
        fontSize: 14,
    },
    paginationText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
});
