// Importamos los componentes básicos que nos da React Native para armar la pantalla
// (como View para las cajas, Text para los textos, TextInput para escribir, etc)
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';

// Importamos el router de expo para poder navegar entre pantallas
import { router } from 'expo-router';

// Nos traemos los iconos de Ionicons para ponerle más onda a la interfaz
import { Ionicons } from '@expo/vector-icons';

// Hook personalizado para asegurarnos que solo los clientes puedan ver esta pantalla
import { useRequireRole } from '../../hooks/useRequireRole';

// Nos traemos toda la lógica pesada desde nuestro hook (así dejamos este archivo más limpio)
import { useMetodosPagos } from '../../hooks/ClienteHooks/useMetodosPagos';

// Y por último importamos los estilos que están en un archivo separado
import { styles } from '../_styles/ClienteStyles/MetodosPagosStyles';

export default function MetodosPagoScreen() {
    // Verificamos que el usuario sea cliente, si no lo pateamos de acá
    useRequireRole('cliente');

    // Desestructuramos todo lo que nos devuelve el hook para usarlo en la vista
    // (acá tenemos los estados como el tipo de tarjeta, la marca, si está cargando, y las funciones para guardar)
    const {
        tipo,
        setTipo,
        marca,
        setMarca,
        ultimos4,
        setUltimos4,
        titular,
        setTitular,
        metodos,
        loading,
        loadingData,
        agregarMetodoPago,
        desactivarMetodo
    } = useMetodosPagos();

    return (
        // Usamos un ScrollView para que si el contenido es muy largo se pueda deslizar hacia abajo
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            
            {/* Botón para volver atrás (le pasamos el router.back para que vuelva a la pantalla anterior) */}
            <TouchableOpacity style={styles.topBackButton} onPress={() => router.back()} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={24} color="#00E676" />
                <Text style={styles.topBackText}>Volver</Text>
            </TouchableOpacity>

            {/* Títulos principales de la pantalla */}
            <Text style={styles.title}>Métodos de pago</Text>
            <Text style={styles.subtitle}>
                Agrega tarjetas simuladas de crédito o débito para recargar tu saldo Q-Ruta.
            </Text>

            {/* Una cajita de información para avisar que no guardamos datos reales */}
            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Importante</Text>
                <Text style={styles.infoText}>
                    No guardamos números reales de tarjeta. Solo se registran los últimos 4 dígitos para simulación.
                </Text>
            </View>

            {/* Contenedor principal donde va el formulario para agregar la tarjeta */}
            <View style={styles.card}>
                
                {/* Selector para elegir si es crédito o débito */}
                <Text style={styles.label}>Tipo de tarjeta</Text>

                <View style={styles.row}>
                    {/* Botón para la opción de Crédito (si está seleccionado le aplicamos estilos extra para que resalte) */}
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            tipo === 'credito' && styles.optionButtonActive,
                        ]}
                        onPress={() => setTipo('credito')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                tipo === 'credito' && styles.optionTextActive,
                            ]}
                        >
                            Crédito
                        </Text>
                    </TouchableOpacity>

                    {/* Botón para la opción de Débito */}
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            tipo === 'debito' && styles.optionButtonActive,
                        ]}
                        onPress={() => setTipo('debito')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.optionText,
                                tipo === 'debito' && styles.optionTextActive,
                            ]}
                        >
                            Débito
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Selector para la marca de la tarjeta */}
                <Text style={styles.label}>Marca</Text>

                {/* Mostramos las opciones de marca usando un map para no repetir tanto código */}
                <View style={styles.brandGrid}>
                    {['Visa', 'Mastercard', 'Diners', 'Amex', 'Discover'].map((b) => {
                        // Vemos si la marca actual del ciclo es la que el usuario seleccionó
                        const activo = marca === b;
                        
                        return (
                            <TouchableOpacity
                                key={b}
                                style={[
                                    styles.brandButton,
                                    activo && styles.brandButtonActive,
                                ]}
                                onPress={() => setMarca(b)}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.brandText,
                                        activo && styles.brandTextActive,
                                    ]}
                                >
                                    {b}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Input para los últimos 4 dígitos (con teclado numérico y límite de 4 caracteres) */}
                <Text style={styles.label}>Últimos 4 dígitos</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ejemplo: 4321"
                    placeholderTextColor="#6B7280"
                    value={ultimos4}
                    onChangeText={setUltimos4}
                    keyboardType="number-pad"
                    maxLength={4}
                />

                {/* Input normal de texto para el nombre del titular */}
                <Text style={styles.label}>Titular</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ejemplo: Jonnath Cedeño"
                    placeholderTextColor="#6B7280"
                    value={titular}
                    onChangeText={setTitular}
                />

                {/* Botón final para guardar la tarjeta (se desactiva si está cargando para que no le den mil veces) */}
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={agregarMetodoPago}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {/* Si está guardando mostramos una ruedita girando, sino el texto normal */}
                    {loading ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>Agregar tarjeta</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Nueva sección abajo para ver las tarjetas que ya están guardadas */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tarjetas registradas</Text>

                {/* Renderizado condicional dependiendo del estado de la data */}
                {loadingData ? (
                    // Si todavía estamos buscando los datos mostramos el loader
                    <ActivityIndicator color="#00E676" />
                ) : metodos.length === 0 ? (
                    // Si ya cargó pero no hay tarjetas mostramos un mensaje vacío
                    <Text style={styles.emptyText}>
                        Todavía no tienes tarjetas registradas.
                    </Text>
                ) : (
                    // Si hay tarjetas hacemos un map para mostrar cada una en su propia tarjetita
                    metodos.map((metodo) => (
                        <View key={metodo.id} style={styles.paymentCard}>
                            <View>
                                <Text style={styles.paymentTitle}>
                                    {metodo.tipo === 'credito' ? 'Crédito' : 'Débito'} · {metodo.marca || 'Tarjeta'}
                                </Text>
                                <Text style={styles.paymentText}>
                                    **** **** **** {metodo.ultimos_4}
                                </Text>
                                <Text style={styles.paymentText}>
                                    Estado: {metodo.estado}
                                </Text>
                            </View>

                            {/* Solo mostramos el botón de desactivar si la tarjeta está activa */}
                            {metodo.estado === 'activa' && (
                                <TouchableOpacity
                                    style={styles.deactivateButton}
                                    onPress={() => desactivarMetodo(metodo.id)}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.deactivateText}>Desactivar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}