import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
    },
    content: {
        padding: 24,
        paddingTop: 56,
        paddingBottom: 40,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontWeight: '700',
    },
    header: {
        marginBottom: 24,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 15,
        lineHeight: 22,
    },
    mainCard: {
        backgroundColor: 'rgba(23, 37, 84, 0.78)',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#00E676',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    mainTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
    },
    mainText: {
        color: '#9CA3AF',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#00E676',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#0B132B',
        fontWeight: '900',
        fontSize: 15,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.72)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    cardMuted: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    couponItem: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
    },
    couponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    couponCode: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 15,
        flex: 1,
        paddingRight: 8,
    },
    couponText: {
        color: '#D1D5DB',
        fontWeight: '700',
        marginBottom: 4,
    },
    couponSmall: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: '900',
        overflow: 'hidden',
    },
    statusDisponible: {
        color: '#0B132B',
        backgroundColor: '#00E676',
    },
    statusUsado: {
        color: '#FFFFFF',
        backgroundColor: '#64748B',
    },
    statusVencido: {
        color: '#FFFFFF',
        backgroundColor: '#F87171',
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 12,
    },
    backButton: {
        alignItems: 'center',
        marginTop: 4,
    },
    backText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
});
// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

