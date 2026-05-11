// Importamos los hooks de React que vamos a usar
import { useCallback, useEffect, useMemo, useState } from 'react';
// Importamos Alert para tirar mensajitos en la pantalla
import { Alert } from 'react-native';
// Nuestra conexión a Supabase
import { supabase } from '../../lib/supabase';
// El hook para saber quién está logueado
import { useAuth } from '../../context/AuthContext';

// Los métodos de pago que puede usar el cliente
export type MetodoPagoCliente = 'tarjeta_qruta' | 'credito' | 'debito';
// Los tipos de gasolina que venden
export type TipoGasolina = 'extra' | 'super' | 'diesel' | 'ecopais';

// Así se ve un cupón de operador
export type CuponOperador = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: 'monto' | 'porcentaje';
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    expira_en: string | null;
};

// Así se ve el pago que generamos para que el cliente escanee
export type PagoGenerado = {
    id: string;
    qr_token: string;
    valor: number;
    tipo_gasolina: string;
    metodo_pago: string;
    cupon_codigo: string | null;
    descuento: number;
    total: number;
    estado: string;
    expira_en: string | null;
};

// Hook principal para crear nuevos pagos QR
export function useAgregarPago() {
    // Sacamos la sesión del operador
    const { session } = useAuth();

    // Estados para el formulario de pago
    const [valor, setValor] = useState('');
    const [metodoPago, setMetodoPago] = useState<MetodoPagoCliente>('tarjeta_qruta');
    const [tipoGasolina, setTipoGasolina] = useState<TipoGasolina>('extra');

    // Estados para los cupones que puede ofrecer el operador
    const [cupones, setCupones] = useState<CuponOperador[]>([]);
    const [cuponSeleccionado, setCuponSeleccionado] = useState<CuponOperador | null>(null);

    // Rueditas de carga
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    
    // Aquí guardamos el QR una vez que se genera
    const [pagoGenerado, setPagoGenerado] = useState<PagoGenerado | null>(null);

    // ID del operador que está usando la app
    const operadorId = session?.user?.id;

    // Convertimos el texto del valor a un número real
    function obtenerValorNumerico() {
        return Number(valor.replace(',', '.'));
    }

    // Calculamos el valor base (lo que cuesta la gasolina)
    const valorNumerico = useMemo(() => {
        const numero = obtenerValorNumerico();
        return Number.isNaN(numero) ? 0 : numero;
    }, [valor]);

    // Calculamos cuánto descuento le vamos a hacer si usamos un cupón
    const descuentoCalculado = useMemo(() => {
        if (!cuponSeleccionado || valorNumerico <= 0) return 0;

        const valorDescuento = Number(cuponSeleccionado.valor_descuento || 0);

        // Si es descuento por porcentaje
        if (cuponSeleccionado.tipo_descuento === 'porcentaje') {
            return Number(((valorNumerico * valorDescuento) / 100).toFixed(2));
        }

        // Si es monto fijo
        return Math.min(valorDescuento, valorNumerico);
    }, [cuponSeleccionado, valorNumerico]);

    // Calculamos el total final que va a pagar el cliente
    const totalCalculado = useMemo(() => {
        return Number(Math.max(valorNumerico - descuentoCalculado, 0).toFixed(2));
    }, [valorNumerico, descuentoCalculado]);

    // Buscamos los cupones que tiene disponibles este operador para ofrecer
    const cargarCuponesOperador = useCallback(async () => {
        if (!operadorId) return;

        try {
            // Prendemos la carga
            setLoadingData(true);

            // Buscamos sus cupones
            const { data, error } = await supabase
                .from('cupones')
                .select(
                    'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, expira_en'
                )
                .eq('propietario_id', operadorId)
                .eq('propietario_rol', 'operador')
                .eq('estado', 'disponible')
                .order('created_at', { ascending: false });

            // Si hay error avisamos
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los cupones del operador');
                return;
            }

            // Filtramos para quitar los que ya expiraron
            const cuponesDisponibles = ((data || []) as CuponOperador[]).filter((cupon) => {
                if (!cupon.expira_en) return true;
                return new Date(cupon.expira_en) >= new Date();
            });

            // Guardamos la lista
            setCupones(cuponesDisponibles);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones');
        } finally {
            // Apagamos la carga
            setLoadingData(false);
        }
    }, [operadorId]);

    // Al cargar la pantalla vamos a traer los cupones
    useEffect(() => {
        cargarCuponesOperador();
    }, [cargarCuponesOperador]);

    // Esta función genera el código raro que va adentro del QR
    function generarTokenQr() {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `QRUTA-${Date.now()}-${random}`;
    }

    // Función principal que crea el pago en la base de datos
    async function generarPagoQr() {
        // Validamos que tengamos al operador
        if (!operadorId) {
            Alert.alert('Error', 'No se pudo obtener el operador actual');
            return;
        }

        // Verificamos que haya puesto un valor
        if (!valor.trim()) {
            Alert.alert('Campo requerido', 'Ingresa el valor a pagar');
            return;
        }

        // Verificamos que el valor sea válido
        if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
            Alert.alert('Valor inválido', 'Ingresa un valor válido mayor a $0.00');
            return;
        }

        // Verificamos que el total no quede en cero
        if (totalCalculado <= 0) {
            Alert.alert('Total inválido', 'El total a pagar no puede ser $0.00');
            return;
        }

        try {
            // Prendemos la ruedita del botón
            setLoading(true);

            // Primero buscamos a qué gasolinera pertenece este operador
            const { data: perfilOperador, error: perfilError } = await supabase
                .from('perfiles')
                .select('gasolinera_id')
                .eq('id', operadorId)
                .single();

            // Si hay error al buscar su gasolinera
            if (perfilError) {
                console.log(perfilError.message);
                Alert.alert('Error', 'No se pudo consultar el perfil del operador');
                return;
            }

            // Si es un operador pero no lo han asignado a una gasolinera lo bloqueamos
            if (!perfilOperador?.gasolinera_id) {
                Alert.alert(
                    'Operador sin gasolinera',
                    'Este operador no tiene una gasolinera asignada'
                );
                return;
            }

            // Generamos el token para el QR
            const qrToken = generarTokenQr();

            // Le damos 5 minutos de vida al QR
            const expiraEn = new Date();
            expiraEn.setMinutes(expiraEn.getMinutes() + 5);

            // Guardamos el pago pendiente en la base de datos
            const { data: pago, error: pagoError } = await supabase
                .from('pagos_qr')
                .insert({
                    qr_token: qrToken,
                    operador_id: operadorId,
                    cliente_id: null,
                    gasolinera_id: perfilOperador.gasolinera_id,
                    valor: valorNumerico,
                    tipo_gasolina: tipoGasolina,
                    metodo_pago: metodoPago,
                    cupon_codigo: cuponSeleccionado?.codigo || null,
                    descuento: descuentoCalculado,
                    total: totalCalculado,
                    // Arranca como pendiente hasta que alguien lo escanee y pague
                    estado: 'pendiente',
                    expira_en: expiraEn.toISOString(),
                    pagado_en: null,
                })
                .select(
                    'id, qr_token, valor, tipo_gasolina, metodo_pago, cupon_codigo, descuento, total, estado, expira_en'
                )
                .single();

            // Si no se pudo guardar el pago avisamos
            if (pagoError) {
                console.log(pagoError.message);
                Alert.alert('Error', 'No se pudo generar el pago QR');
                return;
            }

            // Guardamos el pago generado en el estado para que la pantalla pueda mostrar el QR
            setPagoGenerado(pago as PagoGenerado);

            // Avisamos que ya está listo
            Alert.alert(
                'QR generado',
                'El cliente ya puede escanear este código desde su app'
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al generar el pago QR');
        } finally {
            // Apagamos el loader
            setLoading(false);
        }
    }

    // Función para limpiar todo y hacer un QR nuevo
    function crearOtroPago() {
        setValor('');
        setMetodoPago('tarjeta_qruta');
        setTipoGasolina('extra');
        setCuponSeleccionado(null);
        // Borramos el QR viejo de la pantalla
        setPagoGenerado(null);
    }

    // Este es el valor real que va adentro de la imagen del QR (lo pasamos a JSON para que la app del cliente lo lea bien)
    const qrValue = pagoGenerado
        ? JSON.stringify({ qr_token: pagoGenerado.qr_token })
        : '';

    // Exportamos todo para la pantalla
    return {
        valor,
        setValor,

        metodoPago,
        setMetodoPago,

        tipoGasolina,
        setTipoGasolina,

        cupones,
        cuponSeleccionado,
        setCuponSeleccionado,

        valorNumerico,
        descuentoCalculado,
        totalCalculado,

        loading,
        loadingData,

        pagoGenerado,
        qrValue,

        cargarCuponesOperador,
        generarPagoQr,
        crearOtroPago,
    };
}