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
        marginBottom: 12,
    },
    cardMuted: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 12,
    },
    paymentItem: {
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
    paymentItemActive: {
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
        fontSize: 12,
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
    label: {
        color: '#D1D5DB',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        height: 54,
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 10,
    },
    summaryBox: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderRadius: 18,
        padding: 16,
        marginTop: 14,
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
        color: '#FFFFFF',
        fontWeight: '900',
    },
    summaryDiscount: {
        color: '#F87171',
        fontWeight: '900',
    },
    summaryTotal: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 18,
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
        alignItems: 'center',
        marginTop: 4,
    },
    backText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
});