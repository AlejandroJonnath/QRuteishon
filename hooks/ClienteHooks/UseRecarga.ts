// Importamos hooks de React para manejar estados y cosas en memoria
import { useCallback, useEffect, useMemo, useState } from 'react';
// Importamos Alert para tirar mensajitos emergentes en la pantalla
import { Alert } from 'react-native';
// Router de expo para movernos entre pantallas
import { router } from 'expo-router';
// Nuestra conexión a la base de datos de Supabase
import { supabase } from '../../lib/supabase';
// El hook de autenticación para saber quién está logueado
import { useAuth } from '../../context/AuthContext';

// Definimos los tipos de métodos de pago
export type MetodoRecarga = 'credito' | 'debito';

// Así se ve una tarjeta en la base de datos
export type MetodoPago = {
    id: string;
    usuario_id: string;
    tipo: MetodoRecarga;
    marca: string | null;
    ultimos_4: string;
    titular: string | null;
    estado: string;
};

// Así se ve un cupón de recarga en la base de datos
export type CuponRecarga = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: 'monto' | 'porcentaje';
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    usado_en_pago_id: string | null;
    expira_en: string | null;
};

// Límite máximo de plata que pueden recargar de un solo golpe
export const MONTO_MAXIMO_RECARGA = 200;

// Hook principal para manejar toda la movida de las recargas
export function useRecarga() {
    // Sacamos la sesión actual
    const { session } = useAuth();

    // Estado para guardar la cantidad de plata que quiere meter
    const [monto, setMonto] = useState('');
    // Rueditas de carga
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Estados para guardar las tarjetas que tiene el cliente
    const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
    // Guardamos la tarjeta que eligió para pagar
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] =
        useState<MetodoPago | null>(null);

    // Estados para guardar los cupones disponibles
    const [cupones, setCupones] = useState<CuponRecarga[]>([]);
    // Guardamos el cupón que decidió usar
    const [cuponSeleccionado, setCuponSeleccionado] =
        useState<CuponRecarga | null>(null);

    // Guardamos el ID del usuario
    const usuarioId = session?.user?.id;

    // Función que limpia el texto del input y lo pasa a número de verdad
    function obtenerMontoNumerico() {
        return Number(monto.replace(',', '.'));
    }

    // Usamos useMemo para que no calcule esto a cada rato, solo cuando cambia el monto
    const montoNumerico = useMemo(() => {
        const valor = obtenerMontoNumerico();
        return Number.isNaN(valor) ? 0 : valor;
    }, [monto]);

    // Calculamos cuánto descuento le vamos a hacer con el cupón
    const descuentoCupon = useMemo(() => {
        // Si no hay cupón o no puso monto, no hay descuento
        if (!cuponSeleccionado || montoNumerico <= 0) return 0;

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0);

        // Si el cupón es de porcentaje
        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((montoNumerico * valorDescuento) / 100).toFixed(2));
        }

        // Si es de plata fija (nunca le descontamos más de lo que iba a pagar)
        return Math.min(valorDescuento, montoNumerico);
    }, [cuponSeleccionado, montoNumerico]);

    // Calculamos cuánto termina pagando al final (para mostrarlo en la interfaz)
    const totalSimuladoAPagar = useMemo(() => {
        return Number(Math.max(montoNumerico - descuentoCupon, 0).toFixed(2));
    }, [montoNumerico, descuentoCupon]);

    // Función que va a buscar todas sus tarjetas y cupones a la base de datos
    const cargarDatosRecarga = useCallback(async () => {
        if (!usuarioId) return;

        try {
            // Prendemos la carga
            setLoadingData(true);

            // Buscamos sus tarjetas activas
            const { data: metodosData, error: metodosError } = await supabase
                .from('metodos_pago')
                .select('id, usuario_id, tipo, marca, ultimos_4, titular, estado')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'activa')
                .order('created_at', { ascending: false });

            // Si hay error avisamos
            if (metodosError) {
                console.log(metodosError.message);
                Alert.alert('Error', 'No se pudieron cargar tus métodos de pago');
                return;
            }

            const metodosActivos = (metodosData || []) as MetodoPago[];
            setMetodosPago(metodosActivos);

            // Si tiene tarjetas pero no ha seleccionado ninguna, le marcamos la primera por defecto
            if (metodosActivos.length > 0 && !metodoPagoSeleccionado) {
                setMetodoPagoSeleccionado(metodosActivos[0]);
            }

            // Ahora buscamos sus cupones disponibles
            const { data: cuponesData, error: cuponesError } = await supabase
                .from('cupones')
                .select(
                    'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en'
                )
                .eq('propietario_id', usuarioId)
                .eq('propietario_rol', 'cliente')
                .eq('estado', 'disponible')
                .order('created_at', { ascending: false });

            // Si falla avisamos
            if (cuponesError) {
                console.log(cuponesError.message);
                Alert.alert('Error', 'No se pudieron cargar tus cupones');
                return;
            }

            // Filtramos para asegurarnos de que no nos traiga cupones que ya expiraron
            const cuponesDisponibles = ((cuponesData || []) as CuponRecarga[]).filter(
                (cupon) => {
                    if (!cupon.expira_en) return true;
                    return new Date(cupon.expira_en) >= new Date();
                }
            );

            // Los guardamos en el estado
            setCupones(cuponesDisponibles);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar datos de recarga');
        } finally {
            // Apagamos la carga
            setLoadingData(false);
        }
    }, [usuarioId, metodoPagoSeleccionado]);

    // Al cargar el hook mandamos a traer todo
    useEffect(() => {
        cargarDatosRecarga();
    }, [cargarDatosRecarga]);

    // Función que ya hace la recarga y guarda todo en la base
    async function handleRecargar() {
        const usuarioId = session?.user?.id;
        const montoFinal = obtenerMontoNumerico();

        // Si no hay usuario bloqueamos
        if (!usuarioId) {
            Alert.alert('Error', 'No se pudo obtener el usuario actual');
            return;
        }

        // Si no puso monto no lo dejamos seguir
        if (!monto.trim()) {
            Alert.alert('Campo requerido', 'Ingresa el monto que deseas recargar');
            return;
        }

        // Validamos que sea un número de verdad y mayor a cero
        if (Number.isNaN(montoFinal) || montoFinal <= 0) {
            Alert.alert('Monto inválido', 'Ingresa un monto válido mayor a $0.00');
            return;
        }

        // Controlamos que no se pase del límite de recarga
        if (montoFinal > MONTO_MAXIMO_RECARGA) {
            Alert.alert(
                'Monto excedido',
                `El monto máximo de recarga es $${MONTO_MAXIMO_RECARGA.toFixed(2)}`
            );
            return;
        }

        // Si no escogió tarjeta no puede pagar
        if (!metodoPagoSeleccionado) {
            Alert.alert(
                'Método de pago requerido',
                'Debes tener y seleccionar una tarjeta de crédito o débito activa para recargar'
            );
            return;
        }

        try {
            // Prendemos la ruedita del botón
            setLoading(true);

            // Buscamos su billetera para sumarle la plata
            const { data: billetera, error: billeteraError } = await supabase
                .from('billeteras')
                .select('id, saldo, estado')
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (billeteraError) {
                console.log(billeteraError.message);
                Alert.alert('Error', 'No se pudo consultar tu billetera');
                return;
            }

            if (!billetera) {
                Alert.alert(
                    'Billetera no encontrada',
                    'Tu usuario todavía no tiene una billetera Q-Ruta'
                );
                return;
            }

            if (billetera.estado !== 'activa') {
                Alert.alert(
                    'Billetera inactiva',
                    'Tu billetera no está activa para recibir recargas'
                );
                return;
            }

            // Calculamos cuánto saldo va a tener después de la recarga
            const saldoActual = Number(billetera.saldo || 0);
            const nuevoSaldo = Number((saldoActual + montoFinal).toFixed(2));

            // Guardamos el registro de la recarga
            const { data: recarga, error: recargaError } = await supabase
                .from('recargas')
                .insert({
                    usuario_id: usuarioId,
                    billetera_id: billetera.id,
                    monto: montoFinal,
                    metodo: metodoPagoSeleccionado.tipo,
                    estado: 'aprobada',
                })
                .select('id')
                .single();

            // Si falla la recarga avisamos
            if (recargaError) {
                console.log(recargaError.message);
                Alert.alert('Error', 'No se pudo guardar la recarga');
                return;
            }

            // Actualizamos la billetera con su nuevo saldo
            const { error: saldoError } = await supabase
                .from('billeteras')
                .update({
                    saldo: nuevoSaldo,
                })
                .eq('id', billetera.id);

            if (saldoError) {
                console.log(saldoError.message);
                Alert.alert('Error', 'No se pudo actualizar el saldo');
                return;
            }

            // Armamos un texto bonito para el historial
            const descripcionRecarga = cuponSeleccionado
                ? `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}. Cupón aplicado: ${cuponSeleccionado.codigo}`
                : `Recarga con ${metodoPagoSeleccionado.marca || metodoPagoSeleccionado.tipo} terminada en ${metodoPagoSeleccionado.ultimos_4}`;

            // Guardamos el movimiento en el historial
            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    tipo: 'recarga',
                    descripcion: descripcionRecarga,
                    monto: montoFinal,
                    estado: 'completado',
                    referencia_id: recarga.id,
                });

            // Si falla el historial solo avisamos por consola
            if (movimientoError) {
                console.log(movimientoError.message);
            }

            // Si usó un cupón vamos a quemarlo para que no lo vuelva a usar
            if (cuponSeleccionado) {
                const { error: cuponError } = await supabase
                    .from('cupones')
                    .update({
                        estado: 'usado',
                    })
                    .eq('id', cuponSeleccionado.id)
                    .eq('estado', 'disponible');

                if (cuponError) {
                    console.log(cuponError.message);
                }

                // Guardamos en el historial que usó un cupón
                const { error: movimientoCuponError } = await supabase
                    .from('movimientos')
                    .insert({
                        usuario_id: usuarioId,
                        tipo: 'cupon',
                        descripcion: `Cupón canjeado: ${cuponSeleccionado.codigo}. Descuento simulado: $${descuentoCupon.toFixed(2)}`,
                        monto: 0,
                        estado: 'completado',
                        referencia_id: cuponSeleccionado.id,
                    });

                if (movimientoCuponError) {
                    console.log(movimientoCuponError.message);
                }
            }

            // Final feliz
            Alert.alert(
                'Recarga exitosa',
                cuponSeleccionado
                    ? `Se recargaron $${montoFinal.toFixed(2)}. Descuento simulado aplicado: $${descuentoCupon.toFixed(2)}. Total simulado pagado: $${totalSimuladoAPagar.toFixed(2)}`
                    : `Se recargaron $${montoFinal.toFixed(2)} a tu tarjeta Q-Ruta`,
                [
                    {
                        text: 'Aceptar',
                        // Lo mandamos al inicio del cliente
                        onPress: () => router.replace('/cliente'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al recargar saldo');
        } finally {
            // Apagamos la ruedita
            setLoading(false);
        }
    }

    // Exportamos todo para que la pantalla pueda usarlo
    return {
        monto,
        setMonto,

        loading,
        loadingData,

        metodosPago,
        metodoPagoSeleccionado,
        setMetodoPagoSeleccionado,

        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,

        descuentoCupon,
        totalSimuladoAPagar,

        cargarDatosRecarga,
        handleRecargar,
    };
}