import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B132B',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(11, 19, 43, 0.25)',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#0B132B',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        color: '#D1D5DB',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    scanBox: {
        width: 245,
        height: 245,
        borderRadius: 28,
        borderWidth: 4,
        borderColor: '#00E676',
        backgroundColor: 'rgba(0, 230, 118, 0.08)',
        marginBottom: 28,
    },
    loadingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    loadingText: {
        color: '#FFFFFF',
        marginLeft: 10,
        fontWeight: '700',
    },
    button: {
        backgroundColor: '#00E676',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#0B132B',
        fontWeight: '900',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#00E676',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
        marginBottom: 14,
    },
    secondaryButtonText: {
        color: '#0B132B',
        fontWeight: '900',
    },
    backButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    backText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
});


// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }
