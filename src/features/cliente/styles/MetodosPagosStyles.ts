import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
    },
    content: {
        padding: 24,
        paddingTop: 56,
        paddingBottom: 110,
    },
    topBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    topBackText: {
        color: '#00E676',
        fontWeight: '900',
        fontSize: 16,
        marginLeft: 6,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 15,
        lineHeight: 22,
        marginTop: 8,
        marginBottom: 18,
    },
    infoBox: {
        backgroundColor: 'rgba(0,230,118,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0,230,118,0.35)',
        borderRadius: 18,
        padding: 14,
        marginBottom: 18,
    },
    infoTitle: {
        color: '#00E676',
        fontWeight: '900',
        marginBottom: 4,
    },
    infoText: {
        color: '#D1D5DB',
        fontSize: 13,
        lineHeight: 19,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.72)',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    label: {
        color: '#D1D5DB',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 18,
    },
    optionButton: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    optionButtonActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    optionText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    optionTextActive: {
        color: '#0B132B',
    },
    brandGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    brandButton: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandButtonActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    brandText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
    brandTextActive: {
        color: '#0B132B',
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
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#00E676',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#0B132B',
        fontWeight: '900',
        fontSize: 16,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 14,
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 12,
    },
    paymentCard: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
    },
    paymentTitle: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 15,
    },
    paymentText: {
        color: '#9CA3AF',
        marginTop: 4,
        fontSize: 13,
        fontWeight: '700',
    },
    deactivateButton: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(248,113,113,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.35)',
    },
    deactivateText: {
        color: '#F87171',
        fontWeight: '900',
        fontSize: 12,
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
