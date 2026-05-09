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
        marginBottom: 10,
    },
    text: {
        color: '#9CA3AF',
        fontSize: 16,
        lineHeight: 22,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.72)',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    label: {
        color: '#D1D5DB',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        fontSize: 18,
        marginBottom: 10,
    },
    limitText: {
        color: '#00E676',
        fontSize: 13,
        marginBottom: 10,
        fontWeight: '700',
    },
    warningBox: {
        backgroundColor: 'rgba(248, 113, 113, 0.12)',
        borderColor: 'rgba(248, 113, 113, 0.35)',
        borderWidth: 1,
        padding: 14,
        borderRadius: 16,
        marginBottom: 12,
    },
    warningTitle: {
        color: '#F87171',
        fontWeight: '900',
        marginBottom: 4,
    },
    warningText: {
        color: '#FCA5A5',
        fontSize: 13,
        lineHeight: 19,
    },
    addPaymentButton: {
        marginTop: 12,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#00E676',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPaymentText: {
        color: '#0B132B',
        fontWeight: '900',
        fontSize: 14,
    },
    paymentCard: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentCardActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    paymentTitle: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 15,
    },
    paymentTitleActive: {
        color: '#0B132B',
    },
    paymentText: {
        color: '#9CA3AF',
        marginTop: 4,
        fontSize: 13,
        fontWeight: '700',
    },
    paymentTextActive: {
        color: '#064E3B',
    },
    paymentBadge: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 12,
    },
    paymentBadgeActive: {
        color: '#0B132B',
    },
    couponCard: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
    },
    couponCardActive: {
        backgroundColor: 'rgba(0,230,118,0.12)',
        borderColor: '#00E676',
    },
    couponCode: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 15,
        marginBottom: 4,
    },
    couponText: {
        color: '#D1D5DB',
        fontWeight: '700',
        fontSize: 13,
    },
    couponSmall: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 4,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 13,
        marginBottom: 10,
    },
    summaryBox: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderRadius: 18,
        padding: 16,
        marginTop: 10,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#9CA3AF',
        fontWeight: '700',
    },
    summaryValue: {
        color: '#F87171',
        fontWeight: '900',
    },
    summaryTotal: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 16,
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
        fontSize: 16,
    },
    backButton: {
        marginTop: 18,
        alignItems: 'center',
    },
    backText: {
        color: '#9CA3AF',
        fontWeight: '800',
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
