// Importamos React para dibujar la pantalla
import React from 'react';
// Importamos los componentes visuales nativos como textos, cajas y la ruedita que da vueltas
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
// Importamos los íconos de la librería de Expo
import { Ionicons } from '@expo/vector-icons';
// Importamos las animaciones para que las transiciones entre fases se vean suavecitas
import Animated, { FadeInDown } from 'react-native-reanimated';
// Importamos los mismos estilos del login para que mantenga el color azul oscuro y verde brillante
import { styles } from '../../app/_styles/loginStyles';
// Importamos el gancho que tiene toda la lógica de buscar correos y guardar claves
import { useForgotPasswordForm } from '../../hooks/auth/useForgotPasswordForm';

// Sección
// Este archivo es la interfaz visual del flujo de "Olvidé mi contraseña"
// Se divide en tres fases invisibles que van cambiando en la misma pantalla sin recargar

// Funciones
// ForgotPasswordForm: Dibuja la caja para pedir el correo, la animación falsa de espera y finalmente las dos cajas para la clave nueva

// (Definimos las órdenes que le puede dar la pantalla principal a este pedazo de código)
interface ForgotPasswordFormProps {
    // (La orden de regresar al login principal)
    onNavigateLogin: () => void;
}

// (El componente visual)
export function ForgotPasswordForm({ onNavigateLogin }: ForgotPasswordFormProps) {
    // (Llamamos al gancho para que nos preste todas sus herramientas y funciones secretas)
    const {
        email, setEmail,
        nuevaPassword, setNuevaPassword,
        confirmarPassword, setConfirmarPassword,
        recuperacionFase,
        loading,
        procesarCorreoRecuperacion,
        guardarNuevaContrasena,
        limpiarFormulario
    // (Le decimos al gancho que cuando termine todo el proceso, ejecute esta orden de regresar al login)
    } = useForgotPasswordForm(() => {
        onNavigateLogin();
    });

    return (
        // (La caja invisible que hace el efecto de flotar hacia abajo)
        <Animated.View entering={FadeInDown.duration(400)}>
            {/* FASE 1: Pedir el correo al usuario despistado */}
            {recuperacionFase === 1 && (
                <>
                    <Text style={styles.label}>Correo electrónico</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de carta */}
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="ejemplo@correo.com"
                            placeholderTextColor="#6B7280"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    {/* Botón azulote para empezar a buscar el correo */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        // (Llama a la función del gancho que busca el correo en la base de datos)
                        onPress={procesarCorreoRecuperacion}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#0B132B" size="small" /> : <Text style={styles.buttonText}>Siguiente</Text>}
                    </TouchableOpacity>
                </>
            )}

            {/* FASE 2: Pantalla falsa de carga para darle realismo y seguridad al proceso */}
            {recuperacionFase === 2 && (
                <View style={{ alignItems: 'center', marginVertical: 30 }}>
                    {/* Ruedita verde gigante dando vueltas */}
                    <ActivityIndicator size="large" color="#00E676" />
                    <Text style={{ color: '#00E676', marginTop: 20, fontSize: 16, textAlign: 'center' }}>
                        Enviando verificación a{'\n'}
                        <Text style={{ fontWeight: 'bold' }}>{email}</Text>
                    </Text>
                    <Text style={{ color: '#9CA3AF', marginTop: 10, fontSize: 14, textAlign: 'center' }}>
                        Por favor espere unos segundos...
                    </Text>
                </View>
            )}

            {/* FASE 3: Pedir la nueva clave dos veces para estar seguros */}
            {recuperacionFase === 3 && (
                <>
                    {/* Primera caja para la clave */}
                    <Text style={styles.label}>Nueva Contraseña</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor="#6B7280"
                            value={nuevaPassword}
                            onChangeText={setNuevaPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Segunda caja para confirmar que no tecleó mal */}
                    <Text style={styles.label}>Escriba nuevamente la contraseña</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirma tu contraseña"
                            placeholderTextColor="#6B7280"
                            value={confirmarPassword}
                            onChangeText={setConfirmarPassword}
                            secureTextEntry
                        />
                    </View>
                    
                    {/* Botón azulote final para guardar los cambios */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        // (Llama a la función del gancho que forzará el cambio en la base de datos)
                        onPress={guardarNuevaContrasena}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#0B132B" size="small" /> : <Text style={styles.buttonText}>Guardar</Text>}
                    </TouchableOpacity>
                </>
            )}

            {/* Este botón de regresar aparece siempre a menos que estemos en la pantalla falsa de carga de la fase 2 */}
            {recuperacionFase !== 2 && (
                <TouchableOpacity 
                    onPress={() => {
                        // (Si se arrepiente, limpiamos todo el cochinero)
                        limpiarFormulario();
                        // (Y lo regresamos a donde estaba)
                        onNavigateLogin();
                    }} 
                    disabled={loading} 
                    style={{ alignItems: 'center', marginTop: 16 }}
                >
                    <Text style={{ color: '#9CA3AF', fontSize: 15, fontWeight: '500' }}>Volver a Iniciar Sesión</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas ForgotPasswordForm los usuarios que pierdan sus claves jamás podrán volver a entrar a sus cuentas y llamarán furiosos a soporte)
*/
