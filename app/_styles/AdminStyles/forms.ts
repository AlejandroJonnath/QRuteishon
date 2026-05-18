import { StyleSheet } from 'react-native';

export const formStyles = StyleSheet.create({
    // (Formularios)
    label: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#050B14',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#FFFFFF',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
});
