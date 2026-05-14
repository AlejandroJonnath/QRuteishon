import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert, AlertOptions } from '../utils/AlertManager';
import { styles } from '../app/_styles/GlobalAlertStyles';

export function GlobalAlert() {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertOptions | null>(null);

    useEffect(() => {
        // Nos suscribimos al manager
        CustomAlert.setListener((options) => {
            setConfig(options);
            setVisible(true);
        });
    }, []);

    if (!visible || !config) return null;

    // Si no mandan botones, creamos uno por defecto de "OK"
    const buttons = config.buttons && config.buttons.length > 0 
        ? config.buttons 
        : [{ text: 'OK', style: 'default' as const }];

    // Determinamos qué ícono mostrar según el título (heurística simple)
    const titleLower = config.title.toLowerCase();
    let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
    let iconStyle = styles.iconContainerWarning;
    let iconColor = '#F59E0B'; // Warning yellow

    if (titleLower.includes('error') || titleLower.includes('falló') || titleLower.includes('inválido') || titleLower.includes('vencido') || titleLower.includes('denegado')) {
        iconName = 'close-circle';
        iconStyle = styles.iconContainerError;
        iconColor = '#EF4444'; // Red
    } else if (titleLower.includes('éxito') || titleLower.includes('aprobado') || titleLower.includes('completado') || titleLower.includes('generada')) {
        iconName = 'checkmark-circle';
        iconStyle = styles.iconContainerSuccess;
        iconColor = '#00E676'; // Green
    }

    const handlePress = async (onPress?: () => void | Promise<void>) => {
        setVisible(false);
        // Esperamos un poquito para que la animación del modal termine
        setTimeout(async () => {
            if (onPress) {
                await onPress();
            }
        }, 150);
    };

    const useRow = buttons.length <= 2 && !buttons.some(b => b.text.length > 14);

    return (
        <Modal 
            transparent 
            animationType="fade" 
            visible={visible}
            onRequestClose={() => setVisible(false)} // Para Android back button
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    
                    <View style={[styles.iconContainer, iconStyle]}>
                        <Ionicons name={iconName} size={36} color={iconColor} />
                    </View>

                    <Text style={styles.title}>{config.title}</Text>
                    
                    {config.message ? (
                        <Text style={styles.message}>{config.message}</Text>
                    ) : null}

                    <View style={[
                        styles.buttonsContainer, 
                        useRow ? styles.buttonsRow : null
                    ]}>
                        {buttons.map((btn, index) => {
                            // Definimos el estilo del botón
                            let btnStyle: any = styles.buttonDefault;
                            let txtStyle: any = styles.buttonTextDefault;

                            if (btn.style === 'cancel') {
                                btnStyle = styles.buttonCancel;
                                txtStyle = styles.buttonTextCancel;
                            } else if (btn.style === 'destructive') {
                                btnStyle = styles.buttonDestructive;
                                txtStyle = styles.buttonTextDestructive;
                            }

                            return (
                                <TouchableOpacity 
                                    key={index}
                                    style={[styles.button, useRow ? { flex: 1 } : { width: '100%' }, btnStyle]}
                                    activeOpacity={0.8}
                                    onPress={() => handlePress(btn.onPress)}
                                >
                                    <Text style={[styles.buttonText, txtStyle]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </View>
            </View>
        </Modal>
    );
}
