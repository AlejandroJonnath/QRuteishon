// Importamos React para poder crear la interfaz
import React from 'react';
// Importamos los componentes visuales nativos como cajas de texto, vistas, botones y la ruedita de carga
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
// Importamos los íconos bonitos
import { Ionicons } from '@expo/vector-icons';
// Importamos las animaciones para que todo se mueva fluido y no de golpe
import Animated, { FadeInDown } from 'react-native-reanimated';
// Importamos los estilos globales del login
import { styles } from '../../app/_styles/loginStyles';
// Importamos el gancho o cerebro que controla específicamente la creación de cuentas
import { useRegisterForm } from '../../hooks/auth/useRegisterForm';

// Sección
// Este archivo es únicamente la cara visual (UI) del formulario de registro
// Dibuja las dos páginas del registro (Fase 1: Cuenta y Fase 2: Datos Personales)

// Funciones
// RegisterForm: Se encarga de mostrar los campos correctos dependiendo de si el usuario está en el paso 1 o paso 2 del registro

// (Definimos qué cosas le tienen que pasar desde afuera a este formulario para que funcione)
interface RegisterFormProps {
    // (La función que lo devuelve a la pantalla principal de iniciar sesión)
    onNavigateLogin: () => void;
}

// (El componente visual principal)
export function RegisterForm({ onNavigateLogin }: RegisterFormProps) {
    // (Llamamos al cerebro del registro para que nos preste toooodas sus variables y funciones)
    const {
        usuario, setUsuario,
        cedula, setCedula,
        nombre, setNombre,
        apellido, setApellido,
        telefono, setTelefono,
        email, setEmail,
        password, setPassword,
        registroFase,
        loading,
        siguienteFase,
        faseAnterior,
        handleRegister,
        limpiarFormulario
    // (Le pasamos al cerebro la orden de que cuando termine todo con éxito, vuelva al login)
    } = useRegisterForm(() => {
        onNavigateLogin();
    });

    return (
        // (Contenedor animado que hace que el formulario caiga suavemente desde arriba)
        <Animated.View entering={FadeInDown.duration(400)}>
            {/* Si estamos en el paso 1, mostramos los datos básicos de la cuenta */}
            {registroFase === 1 && (
                <>
                    {/* Título de nombre de usuario */}
                    <Text style={styles.label}>Nombre de usuario</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de un tipito */}
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ejemplo: Jonnath"
                            placeholderTextColor="#6B7280"
                            value={usuario}
                            onChangeText={setUsuario}
                        />
                    </View>

                    {/* Título de correo */}
                    <Text style={styles.label}>Correo electrónico</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de sobre */}
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

                    {/* Título de contraseña */}
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de candado */}
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu contraseña"
                            placeholderTextColor="#6B7280"
                            value={password}
                            onChangeText={setPassword}
                            // (Oculta las letras con puntitos)
                            secureTextEntry
                        />
                    </View>
                </>
            )}

            {/* Si el usuario ya pasó el paso 1, le mostramos el paso 2 con sus datos personales */}
            {registroFase === 2 && (
                <>
                    {/* Título de Nombre */}
                    <Text style={styles.label}>Nombre</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de personita simple */}
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Tu nombre"
                            placeholderTextColor="#6B7280"
                            value={nombre}
                            onChangeText={setNombre}
                        />
                    </View>

                    {/* Título de Apellido */}
                    <Text style={styles.label}>Apellido</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de varias personitas para el apellido/familia */}
                        <Ionicons name="people-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Tu apellido"
                            placeholderTextColor="#6B7280"
                            value={apellido}
                            onChangeText={setApellido}
                        />
                    </View>

                    {/* Título de Cédula */}
                    <Text style={styles.label}>Cédula</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de tarjeta de identificación */}
                        <Ionicons name="id-card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ejemplo: 1723456789"
                            placeholderTextColor="#6B7280"
                            value={cedula}
                            onChangeText={setCedula}
                            // (Saca el teclado numérico para que sea más fácil teclear la cédula)
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Título de Teléfono */}
                    <Text style={styles.label}>Teléfono</Text>
                    <View style={styles.inputContainer}>
                        {/* Ícono de teléfono */}
                        <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ejemplo: 0987654321"
                            placeholderTextColor="#6B7280"
                            value={telefono}
                            onChangeText={setTelefono}
                            // (Saca el teclado de llamadas)
                            keyboardType="phone-pad"
                        />
                    </View>
                </>
            )}

            {/* Botón azulote gigante que hace dos cosas distintas según la fase en la que estemos */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                // (Si estamos en la fase 1, nos manda a la 2. Si estamos en la 2, crea la cuenta)
                onPress={registroFase === 1 ? siguienteFase : handleRegister}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    // (Si está procesando muestra la ruedita)
                    <ActivityIndicator color="#0B132B" size="small" />
                ) : (
                    // (Si no, muestra "Siguiente" o "Crear cuenta" dependiendo de la fase)
                    <Text style={styles.buttonText}>
                        {registroFase === 1 ? 'Siguiente' : 'Crear cuenta'}
                    </Text>
                )}
            </TouchableOpacity>

            {/* Botón de retroceder que solo aparece cuando estamos en la fase 2 */}
            {registroFase === 2 && (
                <TouchableOpacity
                    // (Vuelve a la fase 1 sin borrar los datos escritos)
                    onPress={faseAnterior}
                    disabled={loading}
                    style={{ alignItems: 'center', marginTop: 16 }}
                >
                    <Text style={{ color: '#9CA3AF', fontSize: 15, fontWeight: '500' }}>Volver al paso anterior</Text>
                </TouchableOpacity>
            )}

            {/* Link abajito para devolverse al login si se equivocó y ya tenía cuenta (solo se ve en la fase 1) */}
            {registroFase === 1 && (
                <TouchableOpacity
                    onPress={() => {
                        // (Si se devuelve, borramos toda la basura que haya escrito)
                        limpiarFormulario();
                        // (Lo mandamos de vuelta)
                        onNavigateLogin();
                    }}
                    disabled={loading}
                    style={styles.switchModeContainer}
                >
                    <Text style={styles.switchModeText}>¿Ya tienes una cuenta?</Text>
                    <Text style={styles.link}> Inicia sesión</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas RegisterForm nadie podrá crear cuentas desde la aplicación y tendrás que meterlos manualmente por base de datos)
*/
