// Importamos React para poder crear componentes visuales
import React from 'react';
// Importamos View (contenedores), Text (textos), TextInput (cajas de texto), TouchableOpacity (botones) y ActivityIndicator (la ruedita de carga)
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
// Importamos Ionicons para ponerle dibujitos lindos a los campos de texto
import { Ionicons } from '@expo/vector-icons';
// Importamos Animated y FadeInDown para que el formulario aparezca flotando suavemente
import Animated, { FadeInDown } from 'react-native-reanimated';
// Importamos los estilos maestros para que todo se vea bonito y cuadre con el diseño
import { styles } from '../../app/_styles/loginStyles';
// Importamos el gancho del cerebro del login que creamos antes
import { useLoginForm } from '../../hooks/auth/useLoginForm';

// Sección
// Este archivo es únicamente la cara visual (UI) del formulario de inicio de sesión
// No piensa por sí mismo, solo obedece a useLoginForm y dibuja los botones

// Funciones
// LoginForm: Dibuja las cajas de texto de correo y contraseña, y los botones para entrar o cambiar de pantalla

// (Definimos qué cosas le tienen que pasar desde afuera a este formulario para que funcione)
interface LoginFormProps {
    // (La función que lo manda a la pantalla de crear cuenta)
    onNavigateRegister: () => void;
    // (La función que lo manda a la pantalla de recuperar clave)
    onNavigateForgotPassword: () => void;
}

// (El componente visual principal)
export function LoginForm({ onNavigateRegister, onNavigateForgotPassword }: LoginFormProps) {
    // (Llamamos al cerebro del login para que nos preste sus variables y su función para entrar)
    const { email, setEmail, password, setPassword, loading, handleLogin } = useLoginForm();

    return (
        // (Contenedor animado que hace que el formulario caiga suavemente desde arriba)
        <Animated.View entering={FadeInDown.duration(400)}>
            {/* Título pequeñito encima de la caja de texto */}
            <Text style={styles.label}>Correo electrónico</Text>
            {/* Contenedor que agrupa el ícono y la caja de texto para que se vean juntos */}
            <View style={styles.inputContainer}>
                {/* Ícono de sobrecito gris al lado izquierdo */}
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                {/* Caja donde el usuario escribe su correo */}
                <TextInput
                    style={styles.input}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor="#6B7280"
                    value={email}
                    // (Cada que presiona una tecla, se lo cuenta al cerebro)
                    onChangeText={setEmail}
                    // (Evita que la primera letra se ponga en mayúscula sola)
                    autoCapitalize="none"
                    // (Saca el teclado especial con la arroba)
                    keyboardType="email-address"
                />
            </View>

            {/* Título pequeñito encima de la caja de clave */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                {/* Ícono de candadito gris */}
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor="#6B7280"
                    value={password}
                    // (Le avisa al cerebro cada tecla que presiona)
                    onChangeText={setPassword}
                    // (Cambia las letras por puntitos negros para que nadie espíe)
                    secureTextEntry
                />
            </View>

            {/* Botón azulote gigante para entrar a la app */}
            <TouchableOpacity
                // (Si está cargando le pone un estilo opaco para que se vea apagado)
                style={[styles.button, loading && styles.buttonDisabled]}
                // (Al presionarlo llama a la función maestra del cerebro)
                onPress={handleLogin}
                // (Si está cargando lo bloqueamos para que no le pique mil veces)
                disabled={loading}
                // (Efecto visual de hundimiento al picarle)
                activeOpacity={0.8}
            >
                {loading ? (
                    // (Si está pensando, muestra la ruedita)
                    <ActivityIndicator color="#0B132B" size="small" />
                ) : (
                    // (Si no, muestra la palabra Ingresar)
                    <Text style={styles.buttonText}>Ingresar</Text>
                )}
            </TouchableOpacity>

            {/* Botón invisible abajo que dice Eres nuevo */}
            <TouchableOpacity
                // (Llama a la función que nos pasaron desde afuera para cambiar de vista)
                onPress={onNavigateRegister}
                disabled={loading}
                style={styles.switchModeContainer}
            >
                <Text style={styles.switchModeText}>¿Eres nuevo?</Text>
                <Text style={styles.link}> Regístrate aquí</Text>
            </TouchableOpacity>

            {/* Botón chiquito para los despistados que olvidaron su clave */}
            <TouchableOpacity
                // (Llama a la otra función para ir a la vista de recuperación)
                onPress={onNavigateForgotPassword}
                disabled={loading}
                style={{ alignItems: 'center', marginTop: 12 }}
            >
                <Text style={{ color: '#9CA3AF', fontSize: 14, fontWeight: '500' }}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas LoginForm toda la pantalla inicial de la app estará vacía y nadie podrá entrar)
*/
