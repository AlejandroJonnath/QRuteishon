import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

export const styles = StyleSheet.create({
    // (Layout base)
    container: {
        flex: 1,
        backgroundColor: '#050B14', // Fondo súper oscuro premium
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    
    // (Cabeceras)
    header: {
        marginBottom: 24,
        marginTop: 12,
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
        fontSize: 15,
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

    // (Formularios)
    label: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#050B14',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#FFFFFF',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },

    // (Botones Selector)
    optionButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#050B14',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    optionButtonActive: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        borderColor: '#00E676',
    },
    optionText: {
        color: '#9CA3AF',
        fontWeight: '600',
        fontSize: 14,
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
        backgroundColor: '#00E67680', // Opacidad del 50%
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
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    secondaryButtonFullText: {
        color: '#FFFFFF',
        fontSize: 15,
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
