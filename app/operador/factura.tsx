//Imports de componentes
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TextInput,
} from 'react-native';
//Importamos para poder navegar entre pantallas o volver a la anterior
import { router } from 'expo-router';
//Hook para auth
import { useRequireRole } from '../../hooks/useRequireRole';
//Hook para facturacion
import { useFacturaOperador } from '../../hooks/OperadorHooks/UseFacturaOperador';
// Estilos 
import { styles } from '../_styles/OperadorStyles/FacturaOperadorStyles';

export default function GenerarFactura() {
    useRequireRole('operador');

    const {

        pagos,// pagos contiene la lista de pagos aprobados disponibles para facturar
        pagoSeleccionado,// pagoSeleccionado guarda el pago que el operador eligió para generar la factura

        cedula, // cedula guarda el valor escrito en el campo de cédula
        setCedula,  // setCedula actualiza el valor de cedula cuando el usuario escribe

        nombre, // nombre guarda el valor escrito en el campo de nombre
        setNombre, // setNombre actualiza el valor de nombre cuando el usuario escribe

        apellido, // apellido guarda el valor escrito en el campo de apellido
        setApellido, // setApellido actualiza el valor de apellido cuando el usuario escribe

        telefono, // telefono guarda el valor escrito en el campo de teléfono
        setTelefono, // setTelefono actualiza el valor de telefono cuando el usuario escribe

        correo, // correo guarda el valor escrito en el campo de correo electrónico
        setCorreo, // setCorreo actualiza el valor de correo cuando el usuario escribe

        loadingData, // loadingData indica si todavía se están cargando los pagos aprobados
        loadingFactura, // loadingFactura indica si la factura se está generando en ese momento

        cargarPagosAprobados, // cargarPagosAprobados vuelve a cargar la lista de pagos aprobados

        seleccionarPago, // seleccionarPago guarda como seleccionado el pago que el operador toca

        generarFactura,// generarFactura ejecuta el proceso de generación de factura

    } = useFacturaOperador();

    // Vamos a controlar la pantalla inicial, si loadingData es verdadero, significa que todavía se están obteniendo los pagos aprobados
    if (loadingData) {
        return (
            // View funciona como contenedor principal de la pantalla de carga
            // styles.container aplica el fondo y estructura general
            // styles.center centra el contenido dentro de la pantalla
            <View style={[styles.container, styles.center]}>
                {/* ActivityIndicator muestra el spinner de carga */}
                {/* color define el color verde del indicador */}
                {/* size="large" muestra el indicador en tamaño grande */}
                <ActivityIndicator color="#00E676" size="large" />
                {/* Text muestra un mensaje para informar al usuario qué se está cargando */}
                {/* styles.loadingText aplica el estilo del texto de carga */}
                <Text style={styles.loadingText}>Cargando pagos aprobados...</Text>
            </View>
        );
    }

    // Si loadingData es falso, significa que ya se pueden mostrar los pagos y el formulario
    return (
        // ScrollView permite que toda la pantalla tenga desplazamiento vertical
        // Esto es útil porque la pantalla contiene lista de pagos, formulario, resumen y botón de volver
        <ScrollView
            // Aplicamos el estilo al principal contenedor
            style={styles.container}
            //Aplicamos estilos al contenido que está dentro del contenedor principal
            contentContainerStyle={styles.content}
            // refreshControl agrega la funcionalidad de actualizar al deslizar hacia abajo
            refreshControl={
                <RefreshControl
                    // refreshing indica si actualmente se está ejecutando una recarga de datos
                    refreshing={loadingData}
                    // onRefresh indica qué función se ejecuta cuando el usuario desliza hacia abajo
                    onRefresh={cargarPagosAprobados}
                    // tintColor define el color del indicador de act en iOS
                    tintColor="#00E676"
                    // colors define el color del indicador de act en Android
                    colors={['#00E676']}
                />
            }
        >

            {/*Empezaremos ya con el encabezado */}
            <View style={styles.header}>
                {/*Título */}
                <Text style={styles.title}>Generar factura</Text>
                {/*Subtítulo */}
                <Text style={styles.subtitle}>
                    Selecciona un pago aprobado y completa los datos del cliente.
                </Text>
            </View>

            {/* Tarjeta donde se muestran los pagos aprobados disponibles */}
            <View style={styles.card}>
                {/*Encabezado */}
                <View style={styles.cardHeader}>
                    {/*Título */}
                    <Text style={styles.cardTitle}>Pagos aprobados</Text>
                    {/*Muestra la cantidad de pagos aprobados que están disponibles */}
                    <Text style={styles.cardMuted}>{pagos.length}</Text>
                </View>

                {/* Validamos si no existen pagos aprobados */}
                {pagos.length === 0 ? (
                    // Si no hay pagos, se muestra un mensaje diciendo algo sobre que no existen pagos para facturar xd
                    <Text style={styles.emptyText}>
                        Aún no tienes pagos aprobados para facturar.
                    </Text>
                ) : (
                    // En caso que sí existan pagos, recorremos el array "pagos" para mostrar cada pago como una opción seleccionable
                    pagos.map((pago) => {
                        // activo indica si el pago actual de la lista es el mismo que está seleccionado
                        // Se compara el id del pago seleccionado con el id del pago que se está renderizando
                        const activo = pagoSeleccionado?.id === pago.id;

                        // Retornamos una tarjeta presionable por cada pago aprobado
                        return (
                            // TouchableOpacity permite que cada pago pueda tocarse para seleccionarlo
                            <TouchableOpacity
                                // key ayuda a React a identificar cada elemento único dentro de una lista
                                key={pago.id}
                                // style aplica varios estilos a la tarjeta del pago
                                // styles.paymentItem es el estilo base
                                // activo && styles.paymentItemActive agrega estilo activo solo si el pago está seleccionado
                                style={[
                                    styles.paymentItem,
                                    activo && styles.paymentItemActive,
                                ]}
                                // onPress ejecuta seleccionarPago enviando el pago actual como argumento
                                onPress={() => seleccionarPago(pago)}
                                // activeOpacity controla la opacidad visual cuando el usuario presiona el pago
                                activeOpacity={0.85}
                            >
                                {/* Contenedor que mostrará la agrupación del pago*/}
                                <View>
                                    {/* Muestra el total y el tipo de gasolina */}
                                    <Text
                                        style={[
                                            styles.paymentTitle,
                                            activo && styles.paymentTitleActive,
                                        ]}
                                    >
                                        ${Number(pago.total).toFixed(2)} · {pago.tipo_gasolina}
                                    </Text>

                                    {/* Muestra el método de pago usado */}
                                    <Text
                                        style={[
                                            styles.paymentText,
                                            activo && styles.paymentTextActive,
                                        ]}
                                    >
                                        Método: {pago.metodo_pago}
                                    </Text>

                                    {/* Muestra la fecha en la que el pago fue aprobado o pagado */}
                                    <Text
                                        style={[
                                            styles.paymentText,
                                            activo && styles.paymentTextActive,
                                        ]}
                                    >
                                        Fecha: {pago.pagado_en ? new Date(pago.pagado_en).toLocaleString() : 'Sin fecha'}
                                    </Text>
                                </View>

                                {/* Indica si el pago ya fue seleccionado o si todavía se puede elegir */}
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
            </View>

            {/* OJO: Solo mostrará cuando existe un pago seleccionado*/}
            {/* Si pagoSeleccionado es verdadero, se renderiza el formulario de facturación */}
            {pagoSeleccionado && (
                // Tarjeta que contiene los campos de datos del cliente y el resumen del pago
                <View style={styles.card}>
                    {/* Título*/}
                    <Text style={styles.cardTitle}>Datos de facturación</Text>
                    {/* Cédula*/}
                    <Text style={styles.label}>Cédula</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: 1312345678"
                        placeholderTextColor="#6B7280"
                        value={cedula} // value conecta el input con el estado cedula
                        onChangeText={setCedula} // onChangeText actualiza cedula cada vez que el usuario escribe
                        keyboardType="number-pad" // keyboardType define que se muestre un teclado numérico
                    />

                    {/* Nombre*/}
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: Jonnath"
                        placeholderTextColor="#6B7280"
                        value={nombre} // value conecta el input con el estado nombre
                        onChangeText={setNombre} // onChangeText actualiza nombre cada vez que el usuario escribe
                    />

                    {/* Apellido*/}
                    <Text style={styles.label}>Apellido</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: Cedeño"
                        placeholderTextColor="#6B7280"
                        value={apellido} // value conecta el input con el estado apellido
                        onChangeText={setApellido} // onChangeText actualiza apellido cada vez que el usuario escribe
                    />
                    {/* Teléfono*/}
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ejemplo: +593 0999999999"
                        placeholderTextColor="#6B7280"
                        value={telefono} // value conecta el input con el estado telefono
                        onChangeText={setTelefono} // onChangeText actualiza telefono cada vez que el usuario escribe
                        keyboardType="phone-pad" //Tipo de teclado para números de teléfono
                    />
                    {/* Correo*/}
                    <Text style={styles.label}>Correo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="cliente@correo.com"
                        placeholderTextColor="#6B7280"
                        value={correo}  // value conecta el input con el estado correo
                        onChangeText={setCorreo} // onChangeText actualiza correo cada vez que el usuario escribe
                        keyboardType="email-address"
                        autoCapitalize="none" // autoCapitalize="none" evita que el teclado ponga mayúsculas automáticamente
                    />

                    {/* Mostraremos el resumen del pago: subtotal, descuento y total antes de generar la factura */}
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            {/* Fila del subtotal */}
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>
                                ${Number(pagoSeleccionado.valor).toFixed(2)} {/* Se convierte a número y se muestra con dos decimales */}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Descuento</Text>
                            <Text style={styles.summaryDiscount}>
                                -${Number(pagoSeleccionado.descuento).toFixed(2)} {/* Se muestra con signo negativo para indicar que resta al subtotal */}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total</Text>
                            <Text style={styles.summaryTotal}>
                                ${Number(pagoSeleccionado.total).toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        // Si loadingFactura es verdadero, también aplica el estilo de botón deshabilitado
                        style={[styles.button, loadingFactura && styles.buttonDisabled]}
                        onPress={generarFactura} // onPress ejecuta la función generarFactura
                        disabled={loadingFactura} // disabled deshabilita el botón mientras la factura se está generando
                        activeOpacity={0.85} // activeOpacity controla la opacidad cuando el botón es presionado
                    >
                        {/* Si loadingFactura es verdadero, se muestra un indicador de carga */}
                        {loadingFactura ? (
                            // ActivityIndicator indica que el proceso de generación de factura está en curso
                            <ActivityIndicator color="#0B132B" />
                        ) : (
                            // Si no está cargando, se muestra el texto normal del botón
                            <Text style={styles.buttonText}>Generar factura</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Botón para volver */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}