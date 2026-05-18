// Importamos los componentes visuales básicos de React Native para construir la pantalla
import {
    View,
    Text,
    TouchableOpacity,  // (Botones con efecto de opacidad al presionar)
    ActivityIndicator, // (Ruedita giratoria de carga)
} from 'react-native';
// Importamos el router para poder regresar a la pantalla anterior
import { router } from 'expo-router';
// Importamos el componente CameraView de expo-camera que dibuja la cámara trasera en pantalla
import { CameraView } from 'expo-camera';
// Importamos el guardián que verifica que el usuario sea cliente
import { useRequireRole } from '../../hooks/useRequireRole';
// Importamos el hook que concentra la lógica del escáner QR y el procesamiento del pago
import { usePagarQr } from '../../hooks/ClienteHooks/UsePagarQr';
// Importamos los estilos de esta pantalla
import { styles } from '../_styles/ClienteStyles/Pagar-QR-Styles';

// Sección
// Este archivo es la pantalla del escáner de código QR para el cliente
// Cuando el operador genera un QR en su pantalla, el cliente abre esta pantalla,
// apunta la cámara trasera al QR y la app lo captura automáticamente para procesar el pago
// Tiene tres estados visuales distintos:
// 1) Cargando permisos de cámara (mientras el sistema pregunta si puede usar la cámara)
// 2) Sin permiso de cámara (muestra un botón para solicitarlo)
// 3) Cámara activa con el marco de escaneo y los botones de control

// Funciones
// PagarQr: Componente principal que maneja los tres estados de la pantalla y dibuja la cámara

export default function PagarQr() {
    // (Verificamos que quien entra sea cliente, si no lo redirige al login)
    useRequireRole('cliente');

    // (Desestructuramos todo lo que nos da el hook del escáner QR)
    const {
        permission,           // (Objeto con el estado del permiso de cámara, null mientras carga)
        requestPermission,    // (Función que le pide al sistema operativo el permiso de cámara)
        scanned,              // (Verdadero después de que se escaneó un QR para evitar escanearlo dos veces)
        setScanned,           // (Función para resetear el estado y poder escanear otro QR)
        loadingPago,          // (Verdadero mientras se procesa el pago con Supabase)
        handleBarcodeScanned, // (Función que se dispara automáticamente cuando la cámara detecta un QR)
    } = usePagarQr();

    // (Si el objeto de permiso aún no llegó, significa que el sistema está inicializando la cámara)
    if (!permission) {
        return (
            // (Pantalla centrada de carga mientras se obtiene el estado del permiso)
            <View style={styles.centerContainer}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando permisos...</Text>
            </View>
        );
    }

    // (Si el permiso ya fue evaluado pero el usuario no lo otorgó, mostramos la pantalla de solicitud)
    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                {/* Título explicativo de por qué necesitamos el permiso */}
                <Text style={styles.title}>Permiso de cámara</Text>

                {/* Explicación para el usuario de para qué se usa la cámara */}
                <Text style={styles.subtitle}>
                    QRuta necesita acceso a la cámara para escanear el QR generado por el operador.
                </Text>

                {/* Botón que solicita el permiso de cámara al sistema operativo */}
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Permitir cámara</Text>
                </TouchableOpacity>

                {/* Botón de escape para volver atrás sin dar el permiso */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // (Si tenemos el permiso, mostramos la pantalla completa del escáner)
    return (
        // (Contenedor principal que ocupa toda la pantalla)
        <View style={styles.container}>
            {/* El componente de la cámara trasera del dispositivo */}
            <CameraView
                style={styles.camera}
                // (facing="back" activa la cámara trasera que es la que apunta hacia el QR)
                facing="back"
                // (Configuramos el escáner para que solo detecte QR y no otros códigos de barras)
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                // (Si scanned es verdadero pasamos undefined para pausar el escáner hasta que el usuario decida)
                // (Si scanned es falso pasamos la función que procesa el QR)
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Capa visual encima de la cámara con el marco de guía y los botones */}
            <View style={styles.overlay}>
                {/* Título de la pantalla visible sobre la cámara */}
                <Text style={styles.title}>Escanea el QR</Text>

                {/* Instrucción breve para el usuario */}
                <Text style={styles.subtitle}>
                    Apunta la cámara al código generado por el operador.
                </Text>

                {/* El cuadrado decorativo que indica dónde colocar el QR */}
                <View style={styles.scanBox} />

                {/* (Mostramos la ruedita de procesamiento SOLO mientras se está contactando con Supabase) */}
                {loadingPago && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color="#00E676" />
                        <Text style={styles.loadingText}>Procesando QR...</Text>
                    </View>
                )}

                {/* (El botón de "Escanear de nuevo" SOLO aparece si ya se escaneó algo Y ya terminó de procesar) */}
                {/* (Esto evita que el usuario resetee mientras el pago aún está en proceso) */}
                {scanned && !loadingPago && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        // (Resetea el estado de escaneado para que la cámara vuelva a detectar QRs)
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.secondaryButtonText}>Escanear de nuevo</Text>
                    </TouchableOpacity>
                )}

                {/* Botón para salir de la pantalla de escáner */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas PagarQr los clientes no tendrán ninguna pantalla para escanear el QR y pagar la gasolina)
(si quitas useRequireRole cualquier persona sin cuenta de cliente podría intentar procesar pagos)
(si quitas handleBarcodeScanned la cámara estará activa pero no hará nada al detectar el QR)
(si quitas requestPermission el botón de solicitar permiso de cámara quedará inútil)
(si quitas el control de scanned la cámara procesará el mismo QR múltiples veces generando pagos duplicados)
(si quitas loadingPago el usuario no sabrá si su pago está procesándose y podría cerrar la pantalla antes de que termine)
*/