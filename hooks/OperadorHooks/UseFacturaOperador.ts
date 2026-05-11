// Importamos los hooks de React que vamos a usar
import { useCallback, useEffect, useState } from 'react';
// Importamos Alert para tirar mensajitos emergentes en la pantalla
import { Alert } from 'react-native';
// Router de expo para poder movernos a otras pantallas
import { router } from 'expo-router';
// Nuestra conexión a la base de datos de Supabase
import { supabase } from '../../lib/supabase';
// El hook de autenticación para saber quién está usando la app
import { useAuth } from '../../context/AuthContext';

// Así se ve un pago que ya fue aprobado en la base de datos
export type PagoAprobado = {
    id: string;
    qr_token: string;
    operador_id: string;
    cliente_id: string | null;
    gasolinera_id: string | null;
    valor: number;
    descuento: number;
    total: number;
    tipo_gasolina: string;
    metodo_pago: string;
    estado: string;
    pagado_en: string | null;
    created_at: string;
};

// Hook principal para manejar toda la creación de facturas
export function useFacturaOperador() {
    // Sacamos la sesión actual
    const { session } = useAuth();

    // Estado para guardar la lista de pagos que se pueden facturar
    const [pagos, setPagos] = useState<PagoAprobado[]>([]);
    // Aquí guardamos el pago que el operador eligió para hacerle la factura
    const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoAprobado | null>(null);

    // Estados para todos los datos del formulario de la factura
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');

    // Rueditas de carga
    const [loadingData, setLoadingData] = useState(true);
    const [loadingFactura, setLoadingFactura] = useState(false);

    // Guardamos el ID del operador en una variable cortita
    const operadorId = session?.user?.id;

    // Función que va a buscar a la base de datos los últimos pagos que cobró este operador
    const cargarPagosAprobados = useCallback(async () => {
        if (!operadorId) return;

        try {
            // Prendemos la carga
            setLoadingData(true);

            // Buscamos los pagos en Supabase
            const { data, error } = await supabase
                .from('pagos_qr')
                .select(
                    'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, descuento, total, tipo_gasolina, metodo_pago, estado, pagado_en, created_at'
                )
                // Solo traemos los pagos de este operador
                .eq('operador_id', operadorId)
                // Y que ya estén pagados
                .eq('estado', 'aprobado')
                // Ordenamos del más reciente al más viejo
                .order('pagado_en', { ascending: false })
                // Solo traemos los últimos 20 para no saturar la pantalla
                .limit(20);

            // Si hay un error avisamos
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los pagos aprobados');
                return;
            }

            // Guardamos la lista en el estado
            setPagos((data || []) as PagoAprobado[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar pagos');
        } finally {
            // Apagamos la carga
            setLoadingData(false);
        }
    }, [operadorId]);

    // Cuando cargue el hook mandamos a traer los pagos
    useEffect(() => {
        cargarPagosAprobados();
    }, [cargarPagosAprobados]);

    // Función que se ejecuta cuando el operador toca un pago de la lista
    async function seleccionarPago(pago: PagoAprobado) {
        // Guardamos el pago seleccionado
        setPagoSeleccionado(pago);

        // Limpiamos el formulario por si había datos de otro cliente antes
        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setCorreo('');

        // Si el pago no tiene cliente asociado (por si acaso), no hacemos nada más
        if (!pago.cliente_id) return;

        // Vamos a buscar los datos del cliente a la base de datos para autollenar el formulario
        const { data, error } = await supabase
            .from('perfiles')
            .select('cedula, nombre, apellido, telefono, correo')
            .eq('id', pago.cliente_id)
            .maybeSingle();

        // Si hay error solo lo mostramos en consola para no molestar, igual puede llenarlos a mano
        if (error) {
            console.log(error.message);
            return;
        }

        // Si encontramos los datos del cliente los ponemos en el formulario de una vez
        if (data) {
            setCedula(data.cedula || '');
            setNombre(data.nombre || '');
            setApellido(data.apellido || '');
            setTelefono(data.telefono || '');
            setCorreo(data.correo || '');
        }
    }

    // Función principal para crear y guardar la factura en la base de datos
    async function generarFactura() {
        if (!operadorId) {
            Alert.alert('Error', 'No se pudo obtener el operador actual');
            return;
        }

        // Si no seleccionó a qué pago hacerle factura lo frenamos
        if (!pagoSeleccionado) {
            Alert.alert('Pago requerido', 'Selecciona un pago aprobado para generar la factura');
            return;
        }

        // Revisamos que no deje ningún campo vacío
        if (
            !cedula.trim() ||
            !nombre.trim() ||
            !apellido.trim() ||
            !telefono.trim() ||
            !correo.trim()
        ) {
            Alert.alert(
                'Campos incompletos',
                'Completa cédula, nombre, apellido, teléfono y correo'
            );
            return;
        }

        try {
            // Prendemos el loader del botón
            setLoadingFactura(true);

            // Primero revisamos si por si acaso ya le habían hecho factura a este pago antes
            const { data: facturaExistente, error: facturaExistenteError } = await supabase
                .from('facturas')
                .select('id')
                .eq('pago_id', pagoSeleccionado.id)
                .maybeSingle();

            if (facturaExistenteError) {
                console.log(facturaExistenteError.message);
                Alert.alert('Error', 'No se pudo validar si la factura ya existe');
                return;
            }

            // Si ya existe no lo dejamos hacer otra
            if (facturaExistente) {
                Alert.alert(
                    'Factura existente',
                    'Este pago ya tiene una factura generada'
                );
                return;
            }

            // Creamos la factura en la base de datos
            const { error } = await supabase
                .from('facturas')
                .insert({
                    pago_id: pagoSeleccionado.id,
                    operador_id: operadorId,
                    cliente_id: pagoSeleccionado.cliente_id,
                    cedula: cedula.trim(),
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    telefono: telefono.trim(),
                    correo: correo.trim(),
                    // Guardamos cuánto costaba, cuánto fue de descuento y el total que pagó
                    subtotal: Number(pagoSeleccionado.valor || 0),
                    descuento: Number(pagoSeleccionado.descuento || 0),
                    total: Number(pagoSeleccionado.total || 0),
                    estado: 'emitida',
                });

            // Si hay error en la creación avisamos
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo generar la factura');
                return;
            }

            // Todo salió bien, le mostramos el mensaje
            Alert.alert(
                'Factura generada',
                'La factura fue emitida correctamente',
                [
                    {
                        text: 'Aceptar',
                        // Y lo mandamos al inicio del operador
                        onPress: () => router.replace('/operador'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al generar la factura');
        } finally {
            // Apagamos la ruedita
            setLoadingFactura(false);
        }
    }

    // Exportamos todo para que la pantalla pueda usarlo
    return {
        pagos,
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
    };
}