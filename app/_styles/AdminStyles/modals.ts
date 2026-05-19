import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
    // (Modal Custom Selector)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 11, 20, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#0B132B',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalItemText: {
        fontSize: 16,
        color: '#D1D5DB',
        textAlign: 'center',
    },
    modalCloseButton: {
        marginTop: 16,
        paddingVertical: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // (Modal de formulario - cubre pantalla completa)
    formModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 11, 20, 0.92)',
        justifyContent: 'flex-end',
    },
    formModalContainer: {
        backgroundColor: '#0B132B',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: '#1E293B',
        maxHeight: '90%',
    },
    formModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    formModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    formModalClose: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 15,
    },
    formModalBody: {
        padding: 24,
    },
    createButton: {
        backgroundColor: '#00E676',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#0B132B',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

