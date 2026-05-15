// Importamos React y useState para manejar estados
import React, { useState } from 'react';
// Importamos todos los contenedores visuales de React Native, incluyendo el KeyboardAvoidingView para que el teclado no tape el formulario
import { View, Text, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
// Importamos Animated para que la tarjeta principal aparezca con efecto de rebote
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
// Importamos el ícono de Q-Ruta
import { Ionicons } from '@expo/vector-icons';
// Importamos los estilos maestros
import { styles } from './_styles/loginStyles';
// Importamos el pedazo de código visual que dibuja el login
import { LoginForm } from '../components/auth/LoginForm';
// Importamos el pedazo de código visual que dibuja el registro
import { RegisterForm } from '../components/auth/RegisterForm';
// Importamos el pedazo de código visual que dibuja el formulario de recuperar clave
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';

// Sección
// Este archivo es el contenedor maestro de toda la pantalla de inicio de la aplicación
// Solo sirve de cascarón y decide qué formulario mostrar por dentro sin necesidad de cambiar de página completa

// (Definimos un tipo estricto para no equivocarnos de nombre al cambiar de vistas)
type VistaActual = 'login' | 'registro' | 'recuperacion';

// Funciones
// LoginScreen: Componente principal que engloba el logo de Q-Ruta y los tres formularios internos

export default function LoginScreen() {
    // (Esta es la variable maestra que controla qué se está mostrando adentro de la tarjeta blanca)
    const [vistaActual, setVistaActual] = useState<VistaActual>('login');

    return (
        // (Contenedor que empuja todo hacia arriba cuando abres el teclado en iOS para no tapar los botones)
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#0B132B' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Scroll para que en pantallas chiquitas puedas bajar y ver el botón de entrar */}
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* La barra de arriba del celular (donde sale la hora y batería) con texto blanco */}
                <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

                {/* Luces verdes brillantes decorativas en el fondo */}
                <View style={styles.backgroundGlowTop} />
                <View style={styles.backgroundGlowBottom} />

                {/* La tarjeta flotante gris oscuro donde va todo */}
                <Animated.View
                    // (Efecto de resorte al entrar por primera vez)
                    entering={FadeInDown.duration(800).springify().damping(14)}
                    style={styles.card}
                >
                    {/* El título con el logo */}
                    <View style={styles.headerContainer}>
                        <Ionicons
                            name="qr-code-outline"
                            size={44}
                            color="#00E676"
                            style={styles.headerIcon}
                        />
                        <Text style={styles.logo}>Q-Ruta</Text>
                    </View>

                    {/* El eslogan bonito */}
                    <Text style={styles.subtitle}>Tu gasolina, al instante.</Text>

                    {/* El contenedor mágico que cambia de tamaño fluidamente dependiendo del formulario */}
                    <Animated.View layout={LinearTransition.springify().damping(16)}>
                        
                        {/* Si el estado es 'login', dibuja el formulario de Iniciar Sesión */}
                        {vistaActual === 'login' && (
                            <LoginForm
                                // (Si presionan "Eres nuevo", cambia el estado a registro)
                                onNavigateRegister={() => setVistaActual('registro')}
                                // (Si presionan "Olvidé clave", cambia el estado a recuperacion)
                                onNavigateForgotPassword={() => setVistaActual('recuperacion')}
                            />
                        )}

                        {/* Si el estado es 'registro', dibuja el formulario de Crear Cuenta */}
                        {vistaActual === 'registro' && (
                            <RegisterForm
                                // (Si presionan "Ya tengo cuenta", vuelve al login)
                                onNavigateLogin={() => setVistaActual('login')}
                            />
                        )}

                        {/* Si el estado es 'recuperacion', dibuja el formulario de Olvidé mi Contraseña */}
                        {vistaActual === 'recuperacion' && (
                            <ForgotPasswordForm
                                // (Si terminan o se arrepienten, vuelve al login)
                                onNavigateLogin={() => setVistaActual('login')}
                            />
                        )}
                    </Animated.View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas LoginScreen la aplicación se va a crashear apenas se abra porque esta es la primera pantalla que busca cargar el sistema)
*/