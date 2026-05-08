import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
        justifyContent: 'center',
        padding: 24,
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
        marginBottom: 22,
        fontWeight: '700',
    },
    methodRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    methodButton: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    methodButtonActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    methodText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    methodTextActive: {
        color: '#0B132B',
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
