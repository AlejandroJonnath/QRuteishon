import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
    },
    content: {
        padding: 24,
        paddingTop: 58,
        paddingBottom: 40,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontWeight: '700',
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
        fontSize: 32,
        fontWeight: '900',
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 15,
        lineHeight: 22,
        marginTop: 6,
    },
    mainCard: {
        backgroundColor: 'rgba(23, 37, 84, 0.78)',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    mainIconBox: {
        width: 66,
        height: 66,
        borderRadius: 22,
        backgroundColor: '#00E676',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    mainTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 8,
    },
    mainText: {
        color: '#9CA3AF',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 22,
    },
    primaryButton: {
        height: 56,
        borderRadius: 18,
        backgroundColor: '#00E676',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#0B132B',
        fontWeight: '900',
        fontSize: 15,
    },
    sectionGrid: {
        gap: 14,
        marginBottom: 18,
    },
    optionCard: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    optionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 12,
        marginBottom: 6,
    },
    optionText: {
        color: '#9CA3AF',
        fontSize: 14,
        lineHeight: 20,
    },
    infoCard: {
        backgroundColor: 'rgba(23, 37, 84, 0.72)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    infoTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    infoLabel: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    infoValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    logoutButton: {
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
        fontWeight: '900',
        fontSize: 15,
    },
});

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
