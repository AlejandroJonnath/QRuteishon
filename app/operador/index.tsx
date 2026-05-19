// Importamos los contenedores y componentes visuales que necesitamos para armar la pantalla
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
// Importamos Animated para la animación de entrada al módulo y FadeIn para el efecto de fundido
import Animated, { FadeIn } from 'react-native-reanimated';
// Importamos los dibujitos e íconos que usaremos en los botones
import { Ionicons } from '@expo/vector-icons';
// Importamos el guardián que se asegura que solo los operadores entren aquí
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el cerebro de esta pantalla que trae toda la información del operador
import { useOperadorLogic } from '../../hooks/OperadorHooks/useOperadorLogic';
// Importamos la pintura y estilos para que la pantalla se vea bonita
import { styles } from '../_styles/OperadorStyles/operadorStyles';

// Sección
// Este archivo es el menú principal o tablero de control que ven los operadores (gasolineros) al entrar
// Desde aquí pueden ir a cobrar, ver cupones o generar facturas

// Funciones
// OperadorPanel: Es el componente principal que dibuja toda la interfaz y los botones del menú

export default function OperadorPanel() {
    // (Llamamos al guardián para que nos confirme si de verdad es un operador)
    const { loading } = useRequireRole('operador');

    // (Le pedimos al cerebro del operador todas las herramientas que usaremos en esta pantalla)
    const {
        perfil,
        handleLogout,
        irAgregarPago,
        irHistorialCupones,
        irGenerarFactura,
    } = useOperadorLogic();

    // (Si el guardián sigue pensando o si todavía no nos traen los datos de la base de datos)
    if (loading || !perfil) {
        return (
            // (Mostramos una pantalla negra con una ruedita verde girando para que el usuario espere)
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando panel...</Text>
            </View>
        );
    }

    // (Si ya tenemos todo listo, dibujamos la pantalla completa)
    return (
        // (Envolvemos en Animated.View para que el contenido del módulo entre con un fundido suave de 300ms)
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
        {/* Usamos ScrollView para que puedan deslizar si la pantalla es muy pequeña */}
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            
            {/* El encabezado saludando al trabajador */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Hola, {perfil.usuario}</Text>
                <Text style={styles.title}>Panel Operador</Text>
                <Text style={styles.subtitle}>
                    Genera pagos QR, administra cupones y emite facturas simuladas.
                </Text>
            </View>

            {/* El botón gigante principal que es el que más van a usar */}
            <View style={styles.mainCard}>
                <View style={styles.mainIconBox}>
                    {/* Ícono grandote de un código QR */}
                    <Ionicons name="qr-code-outline" size={42} color="#0B132B" />
                </View>

                <Text style={styles.mainTitle}>Cobro con QR</Text>
                <Text style={styles.mainText}>
                    Crea un pago para que el cliente lo escanee desde su app QRuta.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    // (Cuando le pican, llaman al taxi que los lleva a la pantalla de crear pago)
                    onPress={irAgregarPago}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryButtonText}>
                        Agregar pago y generar QR
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Las dos cajitas de abajo para opciones secundarias */}
            <View style={styles.sectionGrid}>
                
                {/* Botón para ver los cupones */}
                <TouchableOpacity
                    style={styles.optionCard}
                    // (Los manda a revisar qué cupones han usado hoy)
                    onPress={irHistorialCupones}
                    activeOpacity={0.85}
                >
                    <Ionicons name="ticket-outline" size={30} color="#00E676" />
                    <Text style={styles.optionTitle}>Historial de cupones</Text>
                    <Text style={styles.optionText}>
                        Consulta los cupones disponibles o usados.
                    </Text>
                </TouchableOpacity>

                {/* Botón para generar facturas */}
                <TouchableOpacity
                    style={styles.optionCard}
                    // (Los manda a la pantallita de facturación simulada)
                    onPress={irGenerarFactura}
                    activeOpacity={0.85}
                >
                    <Ionicons name="document-text-outline" size={30} color="#00E676" />
                    <Text style={styles.optionTitle}>Generar factura</Text>
                    <Text style={styles.optionText}>
                        Emite una factura simulada con datos del cliente.
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Una tarjeta meramente informativa para que vean quiénes son en el sistema */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Datos del operador</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Usuario</Text>
                    <Text style={styles.infoValue}>{perfil.usuario}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Rol</Text>
                    <Text style={styles.infoValue}>{perfil.rol}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado</Text>
                    <Text style={styles.infoValue}>{perfil.estado}</Text>
                </View>
            </View>

            {/* El clásico botón de salir para terminar el turno */}
            <TouchableOpacity
                style={styles.logoutButton}
                // (Apaga la sesión y lo bota a la pantalla de login)
                onPress={handleLogout}
                activeOpacity={0.85}
            >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
        </Animated.View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas OperadorPanel cuando el gasolinero inicie sesión verá una pantalla negra y no podrá cobrarle a nadie)
*/