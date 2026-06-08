import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0B132B',
        justifyContent: 'center',
        padding: 24,
    },
    backgroundGlowTop: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#00E676',
        opacity: 0.1,
    },
    backgroundGlowBottom: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#1E3A8A',
        opacity: 0.15,
    },
    card: {
        backgroundColor: 'rgba(23, 37, 84, 0.6)',
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    headerIcon: {
        marginRight: 10,
    },
    logo: {
        fontSize: 38,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    subtitle: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginBottom: 32,
        fontSize: 16,
        fontWeight: '500',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#D1D5DB',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        height: '100%',
    },
    button: {
        backgroundColor: '#00E676',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#00E676',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#0B132B',
        fontWeight: '800',
        fontSize: 17,
        letterSpacing: 0.5,
    },
    switchModeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    switchModeText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '500',
    },
    link: {
        color: '#00E676',
        fontSize: 15,
        fontWeight: '700',
    },
});


// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
