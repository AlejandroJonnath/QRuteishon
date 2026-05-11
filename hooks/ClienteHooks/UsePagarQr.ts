// Importamos useState para manejar los estados locales
import { useState } from 'react';
// Importamos Alert para tirar mensajitos en la pantalla del celular
import { Alert } from 'react-native';
// Importamos cositas de la cámara para poder pedir permisos y leer el código de barras o QR
import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
// Importamos router para movernos de pantalla en pantalla
import { router } from 'expo-router';
// Conectamos con Supabase para manejar los datos
import { supabase } from '../../lib/supabase';
// Nos traemos nuestro contexto de autenticación
import { useAuth } from '../../context/AuthContext';

// Definimos la estructura de cómo se ve un Pago QR en la base de datos
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

// Hook principal para manejar toda la movida de escanear y pagar el QR
export function usePagarQr() {
    // Sacamos la sesión para saber qué usuario está usando esto
    const { session } = useAuth();
    // Hook de la cámara que nos da el estado del permiso y la función para pedirlo
    const [permission, requestPermission] = useCameraPermissions();
    // Estado para saber si ya escaneamos algo (y no escanear lo mismo mil veces por segundo)
    const [scanned, setScanned] = useState(false);
    // Ruedita de carga para cuando estamos validando o pagando el QR
    const [loadingPago, setLoadingPago] = useState(false);

    // Función que limpia el texto que lee la cámara y saca solo el token (a veces los QR vienen con formato JSON)
    function extraerToken(data: string) {
        try {
            // Intentamos parsear por si es un JSON
            const parsed = JSON.parse(data);

            // Si es JSON buscamos la propiedad qr_token o token
            if (parsed.qr_token) return String(parsed.qr_token).trim();
            if (parsed.token) return String(parsed.token).trim();

            // Si es un JSON pero no tiene nada de eso devolvemos lo que leyó limpio
            return data.trim();
        } catch {
            // Si directamente falla el parseo (porque era puro texto) lo devolvemos tal cual
            return data.trim();
        }
    }

    // Esta función se dispara automáticamente cuando la cámara detecta un QR
    async function handleBarcodeScanned(result: BarcodeScanningResult) {
        // Si ya escaneamos algo o si estamos procesando un pago lo ignoramos para no chocar procesos
        if (scanned || loadingPago) return;

        // Bloqueamos el escáner para que no lea más
        setScanned(true);

        // Extraemos el token limpio de lo que leyó la cámara
        const token = extraerToken(result.data);

        // Si no vino nada válido le avisamos al usuario y le damos chance de intentar de nuevo
        if (!token) {
            Alert.alert('QR inválido', 'No se pudo leer el código QR', [
                {
                    text: 'Intentar otra vez',
                    // Al darle otra vez volvemos a habilitar el escáner
                    onPress: () => setScanned(false),
                },
            ]);
            return;
        }

        // Si todo salió bien mandamos a buscar el pago en la base de datos usando ese token
        await buscarPago(token);
    }

    // Función que busca el pago en Supabase usando el token del QR
    async function buscarPago(token: string) {
        try {
            // Prendemos la ruedita de carga
            setLoadingPago(true);

            // Buscamos el QR en la tabla pagos_qr
            const { data, error } = await supabase
                .from('pagos_qr')
                .select(
                    'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en, pagado_en'
                )
                .eq('qr_token', token)
                // maybeSingle porque puede que no exista ese QR
                .maybeSingle();

            // Si tiró error la base de datos avisamos
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

            // Si la consulta fue exitosa pero no trajo nada significa que escanearon un QR que nada que ver con nosotros
            if (!data) {
                Alert.alert('QR no encontrado', 'No existe un pago asociado a este QR', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            // Casteamos la data a nuestro tipo para trabajar tranquilos
            const pago = data as PagoQr;

            // Revisamos si el QR ya fue pagado o cancelado (solo queremos los pendientes)
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

            // Verificamos si el QR ya se venció (si tiene fecha de expiración y ya pasó esa fecha)
            if (pago.expira_en && new Date(pago.expira_en) < new Date()) {
                // Si venció lo actualizamos en la base de una vez
                await supabase
                    .from('pagos_qr')
                    .update({
                        estado: 'vencido',
                    })
                    .eq('id', pago.id);

                Alert.alert('QR vencido', 'Este código QR ya expiró', [
                    {
                        text: 'Escanear otro',
                        onPress: () => setScanned(false),
                    },
                ]);
                return;
            }

            // Si llegamos hasta acá el QR es válido, así que mostramos cuánto va a pagar
            const total = Number(pago.total || 0).toFixed(2);

            // Le preguntamos si de verdad quiere pagarlo
            Alert.alert(
                'Confirmar pago',
                `¿Estás seguro de pagar $${total} por gasolina ${pago.tipo_gasolina}?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => setScanned(false), // Si cancela vuelve a escanear
                    },
                    {
                        text: 'Sí, pagar',
                        onPress: () => procesarPago(pago), // Si acepta mandamos a procesar el pago
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
            // Apagamos la ruedita de carga de la búsqueda
            setLoadingPago(false);
        }
    }

    // Función que ya hace el cobro final en la base de datos
    async function procesarPago(pago: PagoQr) {
        // Sacamos el ID del usuario
        const usuarioId = session?.user?.id;

        // Por si acaso no hay usuario logueado lo bloqueamos
        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual');
            setScanned(false);
            return;
        }

        try {
            // Prendemos carga del pago
            setLoadingPago(true);

            // Pasamos el total a número
            const total = Number(pago.total || 0);

            // Validamos que no nos estén cobrando cero o negativo
            if (total <= 0) {
                Alert.alert('Pago inválido', 'El total del pago no es válido');
                setScanned(false);
                return;
            }

            // Si el método de pago dice tarjeta_qruta significa que le cobramos de su saldo de la app
            if (pago.metodo_pago === 'tarjeta_qruta') {
                // Buscamos su billetera
                const { data: billetera, error: billeteraError } = await supabase
                    .from('billeteras')
                    .select('id, saldo, estado')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle();

                if (billeteraError) {
                    console.log(billeteraError.message);
                    Alert.alert('Error', 'No se pudo consultar tu billetera');
                    setScanned(false);
                    return;
                }

                if (!billetera) {
                    Alert.alert('Billetera no encontrada', 'No tienes billetera Q-Ruta');
                    setScanned(false);
                    return;
                }

                if (billetera.estado !== 'activa') {
                    Alert.alert('Billetera inactiva', 'Tu billetera no está activa');
                    setScanned(false);
                    return;
                }

                // Vemos cuánta plata tiene
                const saldoActual = Number(billetera.saldo || 0);

                // Si no le alcanza le avisamos y no cobramos nada
                if (saldoActual < total) {
                    Alert.alert(
                        'Saldo insuficiente',
                        `Tu saldo actual es $${saldoActual.toFixed(2)} y el pago es de $${total.toFixed(2)}`
                    );

                    setScanned(false);
                    return;
                }

                // Calculamos el nuevo saldo restando lo que gastó
                const nuevoSaldo = Number((saldoActual - total).toFixed(2));

                // Le actualizamos el saldo en la base de datos
                const { error: saldoError } = await supabase
                    .from('billeteras')
                    .update({
                        saldo: nuevoSaldo,
                    })
                    .eq('id', billetera.id);

                if (saldoError) {
                    console.log(saldoError.message);
                    Alert.alert('Error', 'No se pudo descontar el saldo');
                    setScanned(false);
                    return;
                }
            }

            // Si llegamos hasta acá (ya sea porque cobramos de la billetera o porque pagó de otra forma)
            // actualizamos el estado del pago a aprobado
            const { error: pagoError } = await supabase
                .from('pagos_qr')
                .update({
                    estado: 'aprobado',
                    cliente_id: usuarioId, // Guardamos quién pagó
                    pagado_en: new Date().toISOString(), // Guardamos a qué hora pagó
                })
                .eq('id', pago.id);

            if (pagoError) {
                console.log(pagoError.message);
                Alert.alert('Error', 'No se pudo aprobar el pago');
                setScanned(false);
                return;
            }

            // Guardamos el historial del movimiento en su cuenta
            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    tipo: 'pago',
                    descripcion: `Pago de gasolina ${pago.tipo_gasolina}`,
                    monto: -total, // Negativo porque es dinero que sale
                    estado: 'completado',
                    referencia_id: pago.id,
                });

            // Si falla el historial solo lo mostramos en consola para no interrumpir el flujo del usuario (ya le cobramos)
            if (movimientoError) {
                console.log(movimientoError.message);
            }

            // Si el QR tenía un cupón aplicado vamos y lo marcamos como usado para que no lo puedan usar de nuevo
            if (pago.cupon_codigo) {
                const { error: cuponError } = await supabase
                    .from('cupones')
                    .update({
                        estado: 'usado',
                        usado_en_pago_id: pago.id, // Relacionamos en qué pago se usó
                    })
                    .eq('codigo', pago.cupon_codigo)
                    .eq('estado', 'disponible');

                if (cuponError) {
                    console.log(cuponError.message);
                }
            }

            // Final feliz, le mostramos el mensaje de que todo salió bien
            Alert.alert(
                'Pago aprobado',
                `Se realizó el pago de $${total.toFixed(2)} correctamente`,
                [
                    {
                        text: 'Aceptar',
                        // Y lo mandamos de regreso al inicio del cliente
                        onPress: () => router.replace('/cliente'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al procesar el pago');
            setScanned(false);
        } finally {
            // Apagamos ruedita
            setLoadingPago(false);
        }
    }

    // Exportamos todo lo que la pantalla visual necesita para funcionar
    return {
        permission,
        requestPermission,
        scanned,
        setScanned,
        loadingPago,
        handleBarcodeScanned,
    };
}
