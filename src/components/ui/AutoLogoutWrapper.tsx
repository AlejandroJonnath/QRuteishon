import React, { useEffect, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export function AutoLogoutWrapper({ children }: { children: React.ReactNode }) {
    const { session, signOut } = useAuth();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1 minuto = 60000 milisegundos
    const TIMEOUT_MS = 60000;

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // Solo corremos el temporizador si hay una sesión activa
        if (session) {
            timerRef.current = setTimeout(() => {
                console.log("Inactividad detectada: Cerrando sesión automáticamente...");
                signOut();
            }, TIMEOUT_MS);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            // Escucha toques al inicio de un gesto
            onStartShouldSetPanResponderCapture: () => {
                resetTimer();
                return false; // Retornamos false para no bloquear los botones o inputs debajo
            },
            // Escucha movimientos continuos (scrolls/arrastres)
            onMoveShouldSetPanResponderCapture: () => {
                resetTimer();
                return false;
            },
        })
    ).current;

    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [session]);

    return (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {children}
        </View>
    );
}
