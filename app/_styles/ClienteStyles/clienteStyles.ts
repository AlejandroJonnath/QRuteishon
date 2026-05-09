import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
    },
    content: {
        padding: 20,
        paddingTop: 58,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        color: '#9CA3AF',
        fontSize: 15,
        marginBottom: 4,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
    balanceCard: {
        backgroundColor: '#00E676',
        borderRadius: 28,
        padding: 24,
        marginBottom: 18,
    },
    balanceLabel: {
        color: '#064E3B',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#0B132B',
        fontSize: 42,
        fontWeight: '900',
    },
    balanceFooter: {
        color: '#064E3B',
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    primaryButton: {
        flex: 1,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButton: {
        flex: 1,
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.09)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    primaryButtonText: {
        color: '#0B132B',
        fontWeight: '800',
        fontSize: 15,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    fullButton: {
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.09)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 18,
        flexDirection: 'row',
    },
    fullButtonIcon: {
        marginRight: 8,
    },
    fullButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.72)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    cardMuted: {
        color: '#9CA3AF',
        fontSize: 13,
    },
    virtualCard: {
        backgroundColor: 'rgba(0, 230, 118, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.3)',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
    },
    virtualCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    virtualCardTitle: {
        color: '#00E676',
        fontSize: 16,
        fontWeight: '900',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    qrCardNumber: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    infoLabel: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    infoValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    couponItem: {
        backgroundColor: 'rgba(0, 230, 118, 0.12)',
        borderColor: 'rgba(0, 230, 118, 0.35)',
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
    },
    couponCode: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 15,
    },
    couponText: {
        color: '#D1D5DB',
        marginTop: 4,
        fontSize: 13,
    },
    movementItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    movementTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    movementDescription: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 3,
    },
    movementAmountPositive: {
        color: '#00E676',
        fontWeight: '900',
    },
    movementAmountNegative: {
        color: '#F87171',
        fontWeight: '900',
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 12,
        fontSize: 14,
    },
    logoutButton: {
        marginTop: 8,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(248, 113, 113, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.35)',
    },
    logoutText: {
        color: '#F87171',
        fontWeight: '800',
        fontSize: 15,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
