// Importamos los componentes visuales básicos de React Native como botones, textos y listas desplazables
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TextInput,
} from 'react-native';
// Importamos router para poder ir a otras pantallas o volver a la anterior
import { router } from 'expo-router';
// Importamos el guardia que verifica que quien intente entrar sea sí o sí un operador
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos toda la lógica y variables relacionadas con las facturas
import { useFacturaOperador } from '../../hooks/OperadorHooks/UseFacturaOperador';
// Importamos los estilos para que la pantalla no se vea como bloc de notas
import { styles } from '../_styles/OperadorStyles/FacturaOperadorStyles';

// Sección
// Este archivo es la pantalla donde el operador puede elegir un pago que ya le hicieron y generarle una factura a nombre de un cliente
// Es útil si el cliente necesita el documento para sus gastos y no quiso registrarse en la app

// Funciones
// GenerarFactura: Dibuja toda la pantalla, la lista de pagos disponibles, los campos para llenar los datos del cliente y el botón para imprimir la factura

export default function GenerarFactura() {
    // (Llamamos al guardia para que nos asegure que no estamos hackeando)
    useRequireRole('operador');

    // (Le pedimos prestado al cerebro de las facturas todas sus variables y funciones)
    const {
        pagos,
        pagosPaginados,
        paginaActual,
        totalPaginas,
        irPaginaAnterior,
        irPaginaSiguiente,
        pagoSeleccionado,
        cedula,
        setCedula,
        nombre,
        setNombre,
        apellido,
        setApellido,
        telefono,
        setTelefono,
        correo,
        setCorreo,
        loadingData,
        loadingFactura,
        cargarPagosAprobados,
        seleccionarPago,
        generarFactura,
    } = useFacturaOperador();

    // (Revisamos si el celular todavía está descargando los pagos viejos desde Supabase)
    if (loadingData) {
        return (
            // (Mostramos la ruedita verde dando vueltas para que el operador no crea que se trabó)
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando pagos aprobados...</Text>
            </View>
        );
    }

    // (Si ya bajó los datos, empezamos a pintar la interfaz)
    return (
        // (Envolvemos todo en un ScrollView para que si el formulario es largo, puedan bajar con el dedo)
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            // (Este pedacito sirve para que si jalan la pantalla para abajo, se actualice la lista de pagos)
            refreshControl={
                <RefreshControl
                    refreshing={loadingData}
                    onRefresh={cargarPagosAprobados}
                    tintColor="#00E676"
                    colors={['#00E676']}
                />
            }
        >

            {/* El encabezado con el título y la explicación de la pantalla */}
            <View style={styles.header}>
                <Text style={styles.title}>Generar factura</Text>
                <Text style={styles.subtitle}>
                    Selecciona un pago aprobado y completa los datos del cliente.
                </Text>
            </View>

            {/* La cajita donde van a aparecer todas las ventas que se han hecho */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Pagos aprobados</Text>
                    {/* (Contamos cuántas ventas hay listas para facturar) */}
                    <Text style={styles.cardMuted}>{pagos.length}</Text>
                </View>

                {/* (Verificamos si no ha vendido nada todavía) */}
                {pagos.length === 0 ? (
                    <Text style={styles.emptyText}>
                        Aún no tienes pagos aprobados para facturar.
                    </Text>
                ) : (
                    // (Si hay ventas, mostramos solo la página actual de 5 pagos)
                    pagosPaginados.map((pago) => {
                        // (Revisamos si el operador ya le picó a este pago o no)
                        const activo = pagoSeleccionado?.id === pago.id;

                        return (
                            // (Botón para seleccionar un pago específico)
                            <TouchableOpacity
                                key={pago.id}
                                // (Si le pica, le cambia el color a verde para que sepa que está seleccionado)
                                style={[
                                    styles.paymentItem,
                                    activo && styles.paymentItemActive,
                                ]}
                                // (Avisa al cerebro cuál es el pago elegido)
                                onPress={() => seleccionarPago(pago)}
                                activeOpacity={0.85}
                            >
                                <View>
                                    {/* (Mostramos cuánta plata fue y qué gasolina le pusieron) */}
                                    <Text
                                        style={[
                                            styles.paymentTitle,
                                            activo && styles.paymentTitleActive,
                                        ]}
                                    >
                                        ${Number(pago.total).toFixed(2)} · {pago.tipo_gasolina}
                                    </Text>

                                    {/* (Mostramos cómo pagó, por ejemplo "Efectivo" o "Tarjeta") */}
                                    <Text
                                        style={[
                                            styles.paymentText,
                                            activo && styles.paymentTextActive,
                                        ]}
                                    >
                                        Método: {pago.metodo_pago}
                                    </Text>

                                    {/* (Mostramos a qué hora y fecha exacta fue la venta) */}
                                    <Text
                                        style={[
                                            styles.paymentText,
                                            activo && styles.paymentTextActive,
                                        ]}
                                    >
                                        Fecha: {pago.pagado_en ? new Date(pago.pagado_en).toLocaleString() : 'Sin fecha'}
                                    </Text>
                                </View>

                                {/* (Mostramos una etiquetita a la derecha que dice si está Elegido o no) */}
                                <Text
                                    style={[
                                        styles.paymentBadge,
                                        activo && styles.paymentBadgeActive,
                                    ]}
                                >
                                    {activo ? 'Seleccionado' : 'Elegir'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* Controles de paginación: solo aparecen si hay más de 5 pagos */}
                {pagos.length > 5 && (
                    <View style={styles.paginacion}>
                        <TouchableOpacity
                            style={[
                                styles.paginacionBtn,
                                paginaActual === 1 && styles.paginacionBtnDisabled,
                            ]}
                            onPress={irPaginaAnterior}
                            disabled={paginaActual === 1}
                            activeOpacity={0.75}
                        >
                            <Text style={[
                                styles.paginacionBtnText,
                                paginaActual === 1 && styles.paginacionBtnTextDisabled,
                            ]}>← Anterior</Text>
                        </TouchableOpacity>

                        <Text style={styles.paginacionInfo}>
                            {paginaActual} / {totalPaginas}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.paginacionBtn,
                                paginaActual === totalPaginas && styles.paginacionBtnDisabled,
                            ]}
                            onPress={irPaginaSiguiente}
                            disabled={paginaActual === totalPaginas}
                            activeOpacity={0.75}
                        >
                            <Text style={[
                                styles.paginacionBtnText,
                                paginaActual === totalPaginas && styles.paginacionBtnTextDisabled,
                            ]}>Siguiente →</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* (Esta parte está oculta y SÓLO aparece cuando el operador elige un pago) */}
            {pagoSeleccionado && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Datos de facturación</Text>

                    {/* Caja para poner la cédula o RUC */}
                    <Text style={styles.label}>Cédula</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 1312345678"
                        placeholderTextColor="#6B7280"
                        value={cedula}
                        onChangeText={setCedula}
                        // (Teclado especial con puros números)
                        keyboardType="number-pad"
                    />

                    {/* Caja para el nombre del cliente */}
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: Jonnath"
                        placeholderTextColor="#6B7280"
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    {/* Caja para el apellido del cliente */}
                    <Text style={styles.label}>Apellido</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: Cedeño"
                        placeholderTextColor="#6B7280"
                        value={apellido}
                        onChangeText={setApellido}
                    />

                    {/* Caja para el número de teléfono por si le escribimos por WhatsApp */}
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: +593 0999999999"
                        placeholderTextColor="#6B7280"
                        value={telefono}
                        onChangeText={setTelefono}
                        // (Teclado especial que tiene el + y números)
                        keyboardType="phone-pad"
                    />

                    {/* Caja para el correo a donde le va a llegar la factura */}
                    <Text style={styles.label}>Correo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="cliente@correo.com"
                        placeholderTextColor="#6B7280"
                        value={correo}
                        onChangeText={setCorreo}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Un cuadrito resumen que desglose el precio por si usaron un cupón de descuento */}
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>
                                {/* (Calculamos el precio normal sin descuentos y le ponemos 2 decimales para que se vea como plata de verdad) */}
                                ${Number(pagoSeleccionado.valor).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Descuento</Text>
                            <Text style={styles.summaryDiscount}>
                                {/* (Mostramos en rojo cuánto le rebajamos) */}
                                -${Number(pagoSeleccionado.descuento).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total</Text>
                            <Text style={styles.summaryTotal}>
                                {/* (Lo que de verdad terminó pagando el cliente) */}
                                ${Number(pagoSeleccionado.total).toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Botón azul gigante para mandar la orden de imprimir/guardar la factura */}
                    <TouchableOpacity
                        // (Lo volvemos opaco si está cargando)
                        style={[styles.button, loadingFactura && styles.buttonDisabled]}
                        // (Llamamos a la función final que hace todo el papeleo)
                        onPress={generarFactura}
                        disabled={loadingFactura}
                        activeOpacity={0.85}
                    >
                        {loadingFactura ? (
                            <ActivityIndicator color="#0B132B" />
                        ) : (
                            <Text style={styles.buttonText}>Generar factura</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* El clásico botón de atrás para salirse de esta pantalla si se arrepiente */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas cargarPagosAprobados la pantalla jamás sabrá cuáles pagos existen y la lista siempre saldrá vacía haciendo la pantalla inútil)
(si quitas seleccionarPago el operador tocará las tarjetas de pago pero no pasará nada y el formulario de abajo nunca aparecerá)
*/