import { StyleSheet } from 'react-native';

export const paginationStyles = StyleSheet.create({
    // (Paginación)
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    paginationButton: {
        backgroundColor: 'rgba(0, 230, 118, 0.08)',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.25)',
    },
    paginationButtonDisabled: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderColor: 'transparent',
        opacity: 0.5,
    },
    paginationButtonText: {
        color: '#00E676',
        fontWeight: 'bold',
        fontSize: 13,
    },
    paginationText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '600',
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
