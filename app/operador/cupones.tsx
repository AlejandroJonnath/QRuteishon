// Importamos las piezas visuales que necesitamos para construir esta pantalla
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
// Importamos router para poder ir hacia atrás
import { router } from 'expo-router';
// Importamos los íconos bonitos
import { Ionicons } from '@expo/vector-icons';
// Importamos el guardián de seguridad que saca a los que no son operadores
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el cerebro que controla todo lo relacionado con los cupones de este operador
import { useCuponesOperador } from '../../hooks/OperadorHooks/UseCuponesOperador';
// Importamos los estilos para pintar la pantalla
import { styles } from '../_styles/OperadorStyles/CuponesOperadorStyles';

// Sección
// Este archivo es la pantalla donde el operador puede ver los cupones que ha creado
// También tiene un botón gigante para regalar un cupón nuevo cada mes

// Funciones
// CuponesOperador: Dibuja la pantalla completa, la lista de cupones y el botón para crear nuevos
// obtenerTextoDescuento: Revisa si el descuento es en plata o en porcentaje para mostrarlo bonito (ej: $5 o 10%)
// obtenerEstiloEstado: Cambia el color de la etiqueta dependiendo de si el cupón está disponible, usado o vencido

export default function CuponesOperador() {
    // (Verificamos rápidamente que el que entró sí sea un operador)
    useRequireRole('operador');

    // (Le pedimos al cerebro todas las herramientas y variables de los cupones)
    const {
        cupones,
        loadingData,
        loadingCrear,
        cargarCupones,
        crearCuponMensual,
    } = useCuponesOperador();

    // (Esta función agarra los números crudos de la base de datos y los convierte en texto entendible para humanos)
    function obtenerTextoDescuento(tipo: string, valor: number) {
        if (tipo === 'porcentaje') {
            return `${valor}% de descuento`;
        }

        return `$${Number(valor).toFixed(2)} de descuento`;
    }

    // (Esta función le pone colorcitos a la palabra "disponible", "usado", etc.)
    function obtenerEstiloEstado(estado: string) {
        if (estado === 'disponible') return styles.statusDisponible;
        if (estado === 'usado') return styles.statusUsado;
        return styles.statusVencido;
    }

    // (Si todavía está descargando los cupones de Supabase, mostramos la ruedita de carga)
    if (loadingData) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando cupones...</Text>
            </View>
        );
    }

    // (Si ya descargó todo, dibujamos la pantalla)
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            // (Le agregamos la función de arrastrar hacia abajo para recargar la lista por si acaso)
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarCupones}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >
            {/* El encabezado con el título principal */}
            <View style={styles.header}>
                <Text style={styles.title}>Historial de cupones</Text>
                <Text style={styles.subtitle}>
                    Cada operador puede generar un cupón mensual de un solo uso.
                </Text>
            </View>

            {/* La tarjeta importante de arriba donde está el botón para crear cupones nuevos */}
            <View style={styles.mainCard}>
                <View style={styles.iconBox}>
                    <Ionicons name="ticket-outline" size={34} color="#0B132B" />
                </View>

                <Text style={styles.mainTitle}>Cupón mensual</Text>
                <Text style={styles.mainText}>
                    Este cupón puede aplicarse al generar un pago QR para ofrecer un descuento simulado.
                </Text>

                <TouchableOpacity
                    // (Le ponemos un estilo opaco si el botón está pensando)
                    style={[styles.button, loadingCrear && styles.buttonDisabled]}
                    // (Llamamos a la función mágica que crea el cupón)
                    onPress={crearCuponMensual}
                    // (Bloqueamos el botón si ya le dio clic para que no cree 20 cupones de golpe)
                    disabled={loadingCrear}
                    activeOpacity={0.85}
                >
                    {loadingCrear ? (
                        <ActivityIndicator color="#0B132B" />
                    ) : (
                        <Text style={styles.buttonText}>Crear cupón del mes</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* La tarjeta de abajo que contiene toda la lista de cupones viejos */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Mis cupones</Text>
                    {/* (Contamos cuántos cupones hay en la lista) */}
                    <Text style={styles.cardMuted}>{cupones.length}</Text>
                </View>

                {/* Si la lista está vacía mostramos un mensaje triste */}
                {cupones.length === 0 ? (
                    <Text style={styles.emptyText}>
                        Aún no tienes cupones registrados.
                    </Text>
                ) : (
                    // (Si hay cupones, los dibujamos uno por uno)
                    cupones.map((cupon) => (
                        <View key={cupon.id} style={styles.couponItem}>
                            <View style={styles.couponHeader}>
                                {/* (Mostramos el código secreto del cupón) */}
                                <Text style={styles.couponCode}>{cupon.codigo}</Text>

                                {/* (Mostramos si está vivo o muerto con su colorcito) */}
                                <Text style={[styles.statusBadge, obtenerEstiloEstado(cupon.estado)]}>
                                    {cupon.estado}
                                </Text>
                            </View>

                            <Text style={styles.couponText}>
                                {/* (Llamamos a nuestra función de arriba para mostrar el $ o el %) */}
                                {obtenerTextoDescuento(
                                    cupon.tipo_descuento,
                                    Number(cupon.valor_descuento)
                                )}
                            </Text>

                            <Text style={styles.couponSmall}>
                                {/* (Revisamos si se puede usar varias veces o no) */}
                                Uso único: {cupon.uso_unico ? 'Sí' : 'No'}
                            </Text>

                            <Text style={styles.couponSmall}>
                                {/* (Convertimos la fecha fea de la base de datos a una fecha legible) */}
                                Expira: {cupon.expira_en ? new Date(cupon.expira_en).toLocaleDateString() : 'Sin fecha'}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            {/* Botón simple para ir hacia atrás */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas obtenerTextoDescuento la aplicación crasheará cada vez que intente dibujar la lista porque no sabrá cómo mostrar el valor)
(si quitas obtenerEstiloEstado todas las etiquetas de los cupones perderán su color y el diseño se verá roto)
*/