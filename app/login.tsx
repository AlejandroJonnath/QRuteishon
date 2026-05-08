
import { // Importaremos lo necesario para la interfaz

    View, //Contenedor (es como un div)
    Text, //Para que se muestre el texto en pantalla
    TextInput, // Inputs xd
    TouchableOpacity, //Para crear botones
    ActivityIndicator, // Servirá para el tiempo de espera, cuando se inicia o registra
    KeyboardAvoidingView, // Este contenedor ayudará a que cuando abras el teclado para escribir, este no tape los campos del formulario
    Platform, // Sirve para detectar si es IOS, Android o Web
    StatusBar, // Permite configurar la barra superior del sistema
    ScrollView, // Para permitir scroll

} from 'react-native';

// Importa Animated para crear componentes animados
// FadeInDown sirve para que un elemento aparezca con una animación desde arriba hacia abajo
// Layout sirve para animar cambios de tamaño o distribución dentro del formulario
import Animated, { FadeInDown, Layout, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons'; //Para los icons de IonIcons
import { styles } from './_styles/loginStyles'; //Estilos
import { useLogin } from '../hooks/useLogin'; // lógica en el apartado de hooks


export default function LoginScreen() { //Exporta la pantalla principal (el login)
    // Obtiene los estados y funciones desde el hook useLogin
    // Esto separa la lógica de autenticación de la parte visual del componente
    const {

        usuario, // Guarda el nombre de usuario cuando el formulario está en modo registro  
        setUsuario, // Función para actualizar el estado usuario
        cedula,
        setCedula,
        nombre,
        setNombre,
        apellido,
        setApellido,
        telefono,
        setTelefono,
        email, // Guarda el correo electrónico ingresado 
        setEmail, // Función para actualizar el estado email    
        password, // Guarda la contraseña ingresada      
        setPassword, // Función para actualizar el estado password  
        loading, // Indica si se está ejecutando una acción, como login o registro
        modoRegistro, // Indica si el formulario está en modo registro. true = mostrar formulario de registro. false = mostrar formulario de inicio de sesión
        registroFase,
        handleLogin, // Función que inicia sesión con Supabase
        handleRegister, // Función que registra un nuevo usuario en Supabase
        siguienteFase,
        faseAnterior,
        cambiarModo // Función que cambia entre modo login y modo registro

    } = useLogin();


    return ( //Retornamos la UI

        <KeyboardAvoidingView //El KeyboardAvoidingView evita que el teclado del celular cubra los inputs
            style={{ flex: 1, backgroundColor: '#0B132B' }} // Estilo base para el teclado
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* 
                Configura la barra de estado superior.
                barStyle="light-content" hace que los íconos de la barra sean claros.
                backgroundColor="#0B132B" pone el fondo de la barra en azul oscuro.
            */}
                <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

                {/* fondo en la parte superior */}
                <View style={styles.backgroundGlowTop} />

                {/* fondo en la parte inferior */}
                <View style={styles.backgroundGlowBottom} />

                {/* 
                Animated.View es una versión animada de View.
                Aquí representa la tarjeta principal del login.
            */}
                <Animated.View
                    /*
                        entering define la animación cuando este componente aparece en pantalla.
    
                        FadeInDown:
                        Hace que la tarjeta aparezca suavemente con efecto de opacidad
                        y desplazamiento vertical. Es decir, entra con un efecto elegante.
    
                        duration(800):
                        Define la duración de la animación en milisegundos.
                        800 ms equivale a 0.8 segundos.
    
                        springify():
                        Convierte la animación en una animación tipo resorte.
                        Esto hace que el movimiento se sienta más natural y menos rígido.
    
                        damping(14):
                        Controla cuánto rebota o se suaviza el efecto de resorte.
                        Un valor de 14 reduce el rebote y hace que la animación se vea fluida.
                        Si el valor fuera más bajo, habría más rebote.
                        Si el valor fuera más alto, la animación sería más seca.
                    */
                    entering={FadeInDown.duration(800).springify().damping(14)}

                    // Aplica los estilos visuales de la tarjeta que tenemos en el _styles
                    style={styles.card}
                >
                    {/* Encabezado, donde están el icono QR y el nombre Q-Ruta */}
                    <View style={styles.headerContainer}>
                        {/* Icono principal de la app, representa el QR */}
                        <Ionicons
                            // Nombre del icono que se mostrará
                            name="qr-code-outline"

                            // Tamaño del icono en píxeles
                            size={44}

                            // Color verde principal del logo
                            color="#00E676"

                            // Estilo adicional del icono
                            style={styles.headerIcon}
                        />

                        {/* Nombre de la aplicación */}
                        <Text style={styles.logo}>Q-Ruta</Text>
                    </View>

                    {/* Slogan o frase corta de la aplicación */}
                    <Text style={styles.subtitle}>Tu gasolina, al instante.</Text>

                    {/* 
                    Animated.View para animar cambios en el layout del formulario.

                    layout={Layout.springify().damping(16)}:
                    Permite que los cambios de tamaño o posición se animen suavemente.
                    Esto se nota cuando aparece o desaparece el campo "Nombre de usuario".

                    Layout:
                    Detecta cambios en la distribución visual.

                    springify():
                    Hace que el cambio de layout tenga movimiento tipo resorte.

                    damping(16):
                    Controla el rebote del resorte.
                    16 es un valor suave, con poco rebote.
                */}
                    <Animated.View layout={LinearTransition.springify().damping(16)}>
                        {/* Fase 1 de registro o inicio de sesión */}
                        {(!modoRegistro || (modoRegistro && registroFase === 1)) && (
                            <Animated.View entering={FadeInDown.duration(400)}>
                                {modoRegistro && (
                                    <>
                                        {/* Etiqueta del campo de nombre de usuario */}
                                        <Text style={styles.label}>Nombre de usuario</Text>

                                        {/* Contenedor del input de usuario con su icono */}
                                        <View style={styles.inputContainer}>
                                            {/* Icono de persona para representar usuario */}
                                            <Ionicons
                                                // Icono de usuario
                                                name="person-outline"

                                                // Tamaño del icono
                                                size={20}

                                                // Color gris claro del icono
                                                color="#9CA3AF"

                                                // Estilo del icono dentro del input
                                                style={styles.inputIcon}
                                            />

                                            {/* Input para escribir el nombre de usuario */}
                                            <TextInput
                                                // Estilo del input
                                                style={styles.input}

                                                // Texto guía que aparece cuando el input está vacío
                                                placeholder="Ejemplo: Jonnath"

                                                // Color del placeholder
                                                placeholderTextColor="#6B7280"

                                                // Valor actual del input, conectado al estado usuario
                                                value={usuario}

                                                // Cada vez que el usuario escribe, actualiza el estado usuario
                                                onChangeText={setUsuario}
                                            />
                                        </View>
                                    </>
                                )}


                                {/* Etiqueta del campo correo electrónico */}
                                <Text style={styles.label}>Correo electrónico</Text>

                                {/* Contenedor del input de correo con icono */}
                                <View style={styles.inputContainer}>
                                    {/* Icono de correo electrónico */}
                                    <Ionicons
                                        // Icono de sobre/correo
                                        name="mail-outline"

                                        // Tamaño del icono
                                        size={20}

                                        // Color gris claro del icono
                                        color="#9CA3AF"

                                        // Estilo del icono dentro del input
                                        style={styles.inputIcon}
                                    />

                                    {/* Input para escribir el correo electrónico */}
                                    <TextInput
                                        // Estilo del input
                                        style={styles.input}

                                        // Texto guía del input
                                        placeholder="ejemplo@correo.com"

                                        // Color del texto guía
                                        placeholderTextColor="#6B7280"

                                        // Valor actual del correo
                                        value={email}

                                        // Actualiza el estado email cada vez que se escribe
                                        onChangeText={setEmail}

                                        // Evita que el teclado ponga mayúscula automáticamente
                                        autoCapitalize="none"

                                        // Muestra un teclado optimizado para correos electrónicos
                                        keyboardType="email-address"
                                    />
                                </View>

                                {/* Etiqueta del campo contraseña */}
                                <Text style={styles.label}>Contraseña</Text>

                                {/* Contenedor del input de contraseña con icono */}
                                <View style={styles.inputContainer}>
                                    {/* Icono de candado */}
                                    <Ionicons
                                        // Icono de candado cerrado
                                        name="lock-closed-outline"

                                        // Tamaño del icono
                                        size={20}

                                        // Color gris claro del icono
                                        color="#9CA3AF"

                                        // Estilo del icono dentro del input
                                        style={styles.inputIcon}
                                    />

                                    {/* Input para escribir la contraseña */}
                                    <TextInput
                                        // Estilo del input
                                        style={styles.input}

                                        // Texto guía del input
                                        placeholder="Ingresa tu contraseña"

                                        // Color del texto guía
                                        placeholderTextColor="#6B7280"

                                        // Valor actual de la contraseña
                                        value={password}

                                        // Actualiza el estado password cada vez que se escribe
                                        onChangeText={setPassword}

                                        // Oculta los caracteres escritos para proteger la contraseña
                                        secureTextEntry
                                    />
                                </View>
                            </Animated.View>
                        )}

                        {/* Fase 2 de registro (Datos personales) */}
                        {modoRegistro && registroFase === 2 && (
                            <Animated.View entering={FadeInDown.duration(400)}>
                                {/* Campo de Nombre */}
                                <Text style={styles.label}>Nombre</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tu nombre"
                                        placeholderTextColor="#6B7280"
                                        value={nombre}
                                        onChangeText={setNombre}
                                    />
                                </View>

                                {/* Campo de Apellido */}
                                <Text style={styles.label}>Apellido</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="people-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tu apellido"
                                        placeholderTextColor="#6B7280"
                                        value={apellido}
                                        onChangeText={setApellido}
                                    />
                                </View>

                                {/* Campo de Cédula */}
                                <Text style={styles.label}>Cédula</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="id-card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ejemplo: 1723456789"
                                        placeholderTextColor="#6B7280"
                                        value={cedula}
                                        onChangeText={setCedula}
                                        keyboardType="numeric"
                                    />
                                </View>

                                {/* Campo de Teléfono */}
                                <Text style={styles.label}>Teléfono</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ejemplo: 0987654321"
                                        placeholderTextColor="#6B7280"
                                        value={telefono}
                                        onChangeText={setTelefono}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </Animated.View>
                        )}

                        {/* Botón principal: sirve para iniciar sesión o crear cuenta */}
                        <TouchableOpacity
                            /*
                                Aplica dos estilos:
                                styles.button siempre se aplica.
                                styles.buttonDisabled solo se aplica cuando loading es true.
                            */
                            style={[styles.button, loading && styles.buttonDisabled]}

                            /*
                                Llama a la función correspondiente según el modo y fase
                            */
                            onPress={modoRegistro ? (registroFase === 1 ? siguienteFase : handleRegister) : handleLogin}

                            // Deshabilita el botón mientras loading sea true para evitar doble clic
                            disabled={loading}

                            /*
                                activeOpacity define qué tanto se transparenta el botón al tocarlo.
                                0.8 significa que baja un poco la opacidad al presionar.
                                Mientras más bajo el número, más fuerte se nota el efecto.
                            */
                            activeOpacity={0.8}
                        >
                            {/* Si loading es true, muestra un indicador de carga */}
                            {loading ? (
                                // Spinner que indica que se está procesando el login o registro
                                <ActivityIndicator color="#0B132B" size="small" />
                            ) : (
                                // Si no está cargando, muestra el texto del botón
                                <Text style={styles.buttonText}>
                                    {/* Cambia el texto del botón dependiendo del modo actual */}
                                    {modoRegistro ? (registroFase === 1 ? 'Siguiente' : 'Crear cuenta') : 'Ingresar'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Botón para volver al paso anterior en la fase 2 */}
                        {modoRegistro && registroFase === 2 && (
                            <TouchableOpacity
                                onPress={faseAnterior}
                                disabled={loading}
                                style={{ alignItems: 'center', marginTop: 16 }}
                            >
                                <Text style={{ color: '#9CA3AF', fontSize: 15, fontWeight: '500' }}>Volver al paso anterior</Text>
                            </TouchableOpacity>
                        )}

                        {/* Botón secundario para cambiar entre login y registro (solo visible en login o fase 1 de registro) */}
                        {!(modoRegistro && registroFase === 2) && (
                            <TouchableOpacity
                                // Al presionar cambia entre modo login y modo registro
                                onPress={cambiarModo}
                                // Si loading es true, no permite cambiar de modo
                                disabled={loading}
                                // Estilo del contenedor del cambio de modo
                                style={styles.switchModeContainer}
                            >
                                {/* Texto principal del cambio de modo */}
                                <Text style={styles.switchModeText}>
                                    {/* Si está en registro pregunta si ya tiene cuenta; si está en login pregunta si es nuevo */}
                                    {modoRegistro ? '¿Ya tienes una cuenta?' : '¿Eres nuevo?'}
                                </Text>

                                {/* Texto resaltado para cambiar de modo */}
                                <Text style={styles.link}>
                                    {/* Si está en registro ofrece iniciar sesión; si está en login ofrece registrarse */}
                                    {modoRegistro ? ' Inicia sesión' : ' Regístrate aquí'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}