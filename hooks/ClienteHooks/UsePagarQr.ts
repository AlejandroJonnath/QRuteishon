import { useState } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { PagosService } from '../../services/PagosService';
import { BilleteraService } from '../../services/BilleteraService';
import { extraerToken } from '../../utils/formatters';

export type PagoQr = {
    id: string;
    qr_token: string;
    operador_id: string;
    cliente_id: string | null;
    gasolinera_id: string | null;
    valor: number;
    tipo_gasolina: string;
    metodo_pago: string;
    cupon_codigo: string | null;
    descuento: number;
    total: number;
    estado: string;
    expira_en: string | null;
    pagado_en: string | null;
};

export function usePagarQr() {
    const { session } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    
    // Evitamos que lea códigos a lo loco
    const [scanned, setScanned] = useState(false);
    
    const [loadingPago, setLoadingPago] = useState(false);

    async function handleBarcodeScanned(result: BarcodeScanningResult) {
        // (Si ya procesamos uno o estamos en eso ignoramos las demás lecturas)
        if (scanned || loadingPago) return;

        setScanned(true);

        // Usamos nuestro helper para limpiar la basura que a veces viene en el QR
        const token = extraerToken(result.data);

        if (!token) {
            Alert.alert('QR inválido', 'No se pudo leer el código QR', [
                {
                    text: 'Intentar otra vez',
                    onPress: () => setScanned(false),
                },
            ]);
            return;
        }

        await buscarPago(token);
    }

    async function buscarPago(token: string) {
        try {
            setLoadingPago(true);

            // Delegamos la búsqueda pesada a nuestro servicio de pagos
            const { data: pago, error } = await PagosService.buscarPagoPorToken(token);

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo consultar el pago QR', [
                    {
                        text: 'Intentar otra vez',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            if (!pago) {
                Alert.alert('QR no encontrado', 'No existe un pago asociado a este QR', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            if (pago.estado !== 'pendiente') {
                Alert.alert(
                    'QR no disponible',
                    `Este QR ya tiene estado: ${pago.estado}`,
                    [
                        {
                            text: 'Escanear otro',
                            onPress: () => setScanned(false),
                        },
                    ]
                );
                return;
            }

            // Si ya se pasó la hora lo quemamos de una vez
            if (pago.expira_en && new Date(pago.expira_en) < new Date()) {
                await PagosService.marcarVencido(pago.id);

                Alert.alert('QR vencido', 'Este código QR ya expiró', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            const total = Number(pago.total || 0).toFixed(2);

            // Le pedimos que nos jure que quiere pagarlo
            Alert.alert(
                'Confirmar pago',
                `¿Estás seguro de pagar $${total} por gasolina ${pago.tipo_gasolina}?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => setScanned(false),
                    },
                    {
                        text: 'Sí, pagar',
                        onPress: () => procesarPago(pago),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al leer el QR', [
                {
                    text: 'Intentar otra vez',
                    onPress: () => setScanned(false),
                },
            ]);
        } finally {
            setLoadingPago(false);
        }
    }

    async function procesarPago(pago: PagoQr) {
        const usuarioId = session?.user?.id;

        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual');
            setScanned(false);
            return;
        }

        try {
            setLoadingPago(true);

            const total = Number(pago.total || 0);

            if (total <= 0) {
                Alert.alert('Pago inválido', 'El total del pago no es válido');
                setScanned(false);
                return;
            }

            // Si es con saldo de la app hacemos toda la verificación de la billetera
            if (pago.metodo_pago === 'tarjeta_qruta') {
                const { data: billetera, error: billeteraError } = await BilleteraService.obtenerBilletera(usuarioId);

                if (billeteraError) {
                    console.log(billeteraError.message);
                    Alert.alert('Error', 'No se pudo consultar tu billetera');
                    setScanned(false);
                    return;
                }

                if (!billetera || billetera.estado !== 'activa') {
                    Alert.alert('Billetera inactiva o no encontrada', 'Tu billetera no está lista');
                    setScanned(false);
                    return;
                }

                const saldoActual = Number(billetera.saldo || 0);

                if (saldoActual < total) {
                    Alert.alert(
                        'Saldo insuficiente',
                        `Tu saldo actual es $${saldoActual.toFixed(2)} y el pago es de $${total.toFixed(2)}`
                    );
                    setScanned(false);
                    return;
                }

                const nuevoSaldo = Number((saldoActual - total).toFixed(2));

                // Mandamos toda la transacción a nuestro servicio
                const result = await PagosService.procesarPagoBilletera(
                    pago, 
                    usuarioId, 
                    billetera.id, 
                    nuevoSaldo
                );

                if (result.error && result.paso !== 'movimiento') {
                    console.log(result.error.message);
                    Alert.alert('Error', `Ocurrió un problema en el paso: ${result.paso}`);
                    setScanned(false);
                    return;
                }
            } else {
                // (Si es otro método de pago igual llamamos al servicio pasando el mismo saldo porque no afecta a la billetera)
                // TODO: Habría que hacer otra función en el servicio si no afecta billetera
            }

            Alert.alert(
                'Pago aprobado',
                `Se realizó el pago de $${total.toFixed(2)} correctamente`,
                [
                    {
                        text: 'Aceptar',
                        onPress: () => router.replace('/cliente'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al procesar el pago');
            setScanned(false);
        } finally {
            setLoadingPago(false);
        }
    }

    return {
        permission,
        requestPermission,
        scanned,
        setScanned,
        loadingPago,
        handleBarcodeScanned,
    };
}
