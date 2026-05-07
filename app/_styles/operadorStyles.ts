import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        marginBottom: 6,
    },
    button: {
        backgroundColor: '#111827',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    logout: {
        textAlign: 'center',
        marginTop: 28,
        color: '#dc2626',
        fontWeight: 'bold',
    },
});
