import { useState } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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
    const [scanned, setScanned] = useState(false);
    const [loadingPago, setLoadingPago] = useState(false);

    function extraerToken(data: string) {
        try {
            const parsed = JSON.parse(data);

            if (parsed.qr_token) return String(parsed.qr_token).trim();
            if (parsed.token) return String(parsed.token).trim();

            return data.trim();
        } catch {
            return data.trim();
        }
    }

    async function handleBarcodeScanned(result: BarcodeScanningResult) {
        if (scanned || loadingPago) return;

        setScanned(true);

        const token = extraerToken(result.data);

        if (!token) {
            Alert.alert('QR inválido', 'No se pudo leer el código QR.', [
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

            const { data, error } = await supabase
                .from('pagos_qr')
                .select(
                    'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en, pagado_en'
                )
                .eq('qr_token', token)
                .maybeSingle();

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo consultar el pago QR.', [
                    {
                        text: 'Intentar otra vez',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            if (!data) {
                Alert.alert('QR no encontrado', 'No existe un pago asociado a este QR.', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            const pago = data as PagoQr;

            if (pago.estado !== 'pendiente') {
                Alert.alert(
                    'QR no disponible',
                    `Este QR ya tiene estado: ${pago.estado}.`,
                    [
                        {
                            text: 'Escanear otro',
                            onPress: () => setScanned(false),
                        },
                    ]
                );
                return;
            }

            if (pago.expira_en && new Date(pago.expira_en) < new Date()) {
                await supabase
                    .from('pagos_qr')
                    .update({
                        estado: 'vencido',
                    })
                    .eq('id', pago.id);

                Alert.alert('QR vencido', 'Este código QR ya expiró.', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            const total = Number(pago.total || 0).toFixed(2);

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
            Alert.alert('Error inesperado', 'Ocurrió un problema al leer el QR.', [
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
            Alert.alert('Error', 'No se pudo obtener el usuario actual.');
            setScanned(false);
            return;
        }

        try {
            setLoadingPago(true);

            const total = Number(pago.total || 0);

            if (total <= 0) {
                Alert.alert('Pago inválido', 'El total del pago no es válido.');
                setScanned(false);
                return;
            }

            if (pago.metodo_pago === 'tarjeta_qruta') {
                const { data: billetera, error: billeteraError } = await supabase
                    .from('billeteras')
                    .select('id, saldo, estado')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle();

                if (billeteraError) {
                    console.log(billeteraError.message);
                    Alert.alert('Error', 'No se pudo consultar tu billetera.');
                    setScanned(false);
                    return;
                }

                if (!billetera) {
                    Alert.alert('Billetera no encontrada', 'No tienes billetera Q-Ruta.');
                    setScanned(false);
                    return;
                }

                if (billetera.estado !== 'activa') {
                    Alert.alert('Billetera inactiva', 'Tu billetera no está activa.');
                    setScanned(false);
                    return;
                }

                const saldoActual = Number(billetera.saldo || 0);

                if (saldoActual < total) {
                    Alert.alert(
                        'Saldo insuficiente',
                        `Tu saldo actual es $${saldoActual.toFixed(2)} y el pago es de $${total.toFixed(2)}.`
                    );

                    setScanned(false);
                    return;
                }

                const nuevoSaldo = Number((saldoActual - total).toFixed(2));

                const { error: saldoError } = await supabase
                    .from('billeteras')
                    .update({
                        saldo: nuevoSaldo,
                    })
                    .eq('id', billetera.id);

                if (saldoError) {
                    console.log(saldoError.message);
                    Alert.alert('Error', 'No se pudo descontar el saldo.');
                    setScanned(false);
                    return;
                }
            }

            const { error: pagoError } = await supabase
                .from('pagos_qr')
                .update({
                    estado: 'aprobado',
                    cliente_id: usuarioId,
                    pagado_en: new Date().toISOString(),
                })
                .eq('id', pago.id);

            if (pagoError) {
                console.log(pagoError.message);
                Alert.alert('Error', 'No se pudo aprobar el pago.');
                setScanned(false);
                return;
            }

            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    tipo: 'pago',
                    descripcion: `Pago de gasolina ${pago.tipo_gasolina}`,
                    monto: -total,
                    estado: 'completado',
                    referencia_id: pago.id,
                });

            if (movimientoError) {
                console.log(movimientoError.message);
            }

            if (pago.cupon_codigo) {
                const { error: cuponError } = await supabase
                    .from('cupones')
                    .update({
                        estado: 'usado',
                        usado_en_pago_id: pago.id,
                    })
                    .eq('codigo', pago.cupon_codigo)
                    .eq('estado', 'disponible');

                if (cuponError) {
                    console.log(cuponError.message);
                }
            }

            Alert.alert(
                'Pago aprobado',
                `Se realizó el pago de $${total.toFixed(2)} correctamente.`,
                [
                    {
                        text: 'Aceptar',
                        onPress: () => router.replace('/cliente'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al procesar el pago.');
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
