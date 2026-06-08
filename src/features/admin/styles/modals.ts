import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

export const modalStyles = StyleSheet.create({
    // (Modal Custom Selector)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 11, 20, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#0B132B',
        borderRadius: 24,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 15,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalItemText: {
        fontSize: 15,
        color: '#D1D5DB',
        textAlign: 'center',
        fontWeight: '500',
    },
    modalCloseButton: {
        marginTop: 16,
        paddingVertical: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    modalCloseText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // (Modal de formulario — cubre pantalla desde abajo)
    formModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 11, 20, 0.92)',
        justifyContent: 'flex-end',
    },
    formModalContainer: {
        backgroundColor: '#0B132B',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#1E293B',
        // (En pantallas pequeñas damos más espacio; en grandes limitamos para no tapar todo)
        maxHeight: isSmall ? '95%' : '90%',
    },
    formModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: isSmall ? 16 : 24,
        paddingTop: isSmall ? 16 : 22,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    formModalTitle: {
        fontSize: isSmall ? 16 : 19,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        flex: 1,
    },
    formModalClose: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
        paddingLeft: 12,
        paddingVertical: 6,
    },
    formModalBody: {
        paddingHorizontal: isSmall ? 14 : 24,
        paddingBottom: 16,
    },
    createButton: {
        backgroundColor: '#00E676',
        borderRadius: 14,
        paddingVertical: isSmall ? 14 : 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: isSmall ? 20 : 28,
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    createButtonText: {
        color: '#0B132B',
        fontSize: isSmall ? 14 : 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
