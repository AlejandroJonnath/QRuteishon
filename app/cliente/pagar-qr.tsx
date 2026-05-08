import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView } from 'expo-camera';
import { useRequireRole } from '../../hooks/useRequireRole';
import { usePagarQr } from '../../hooks/UsePagarQr';
import { styles } from '../_styles/Pagar-QR-Styles';

export default function PagarQr() {
    useRequireRole('cliente');

    const {
        permission,
        requestPermission,
        scanned,
        setScanned,
        loadingPago,
        handleBarcodeScanned,
    } = usePagarQr();

    if (!permission) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator color="#00E676" size="large" />
                <Text style={styles.loadingText}>Cargando permisos...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.title}>Permiso de cámara</Text>

                <Text style={styles.subtitle}>
                    QRuta necesita acceso a la cámara para escanear el QR generado por el operador.
                </Text>

                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Permitir cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            <View style={styles.overlay}>
                <Text style={styles.title}>Escanea el QR</Text>

                <Text style={styles.subtitle}>
                    Apunta la cámara al código generado por el operador.
                </Text>

                <View style={styles.scanBox} />

                {loadingPago && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color="#00E676" />
                        <Text style={styles.loadingText}>Procesando QR...</Text>
                    </View>
                )}

                {scanned && !loadingPago && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.secondaryButtonText}>Escanear de nuevo</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}