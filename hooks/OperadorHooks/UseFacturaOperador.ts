import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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

export function useFacturaOperador() {
    const { session } = useAuth();

    const [pagos, setPagos] = useState<PagoAprobado[]>([]);
    const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoAprobado | null>(null);

    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');

    const [loadingData, setLoadingData] = useState(true);
    const [loadingFactura, setLoadingFactura] = useState(false);

    const operadorId = session?.user?.id;

    const cargarPagosAprobados = useCallback(async () => {
        if (!operadorId) return;

        try {
            setLoadingData(true);

            const { data, error } = await supabase
                .from('pagos_qr')
                .select(
                    'id, qr_token, operador_id, cliente_id, gasolinera_id, valor, descuento, total, tipo_gasolina, metodo_pago, estado, pagado_en, created_at'
                )
                .eq('operador_id', operadorId)
                .eq('estado', 'aprobado')
                .order('pagado_en', { ascending: false })
                .limit(20);

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los pagos aprobados.');
                return;
            }

            setPagos((data || []) as PagoAprobado[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar pagos.');
        } finally {
            setLoadingData(false);
        }
    }, [operadorId]);

    useEffect(() => {
        cargarPagosAprobados();
    }, [cargarPagosAprobados]);

    async function seleccionarPago(pago: PagoAprobado) {
        setPagoSeleccionado(pago);

        setCedula('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setCorreo('');

        if (!pago.cliente_id) return;

        const { data, error } = await supabase
            .from('perfiles')
            .select('cedula, nombre, apellido, telefono, correo')
            .eq('id', pago.cliente_id)
            .maybeSingle();

        if (error) {
            console.log(error.message);
            return;
        }

        if (data) {
            setCedula(data.cedula || '');
            setNombre(data.nombre || '');
            setApellido(data.apellido || '');
            setTelefono(data.telefono || '');
            setCorreo(data.correo || '');
        }
    }

    async function generarFactura() {
        if (!operadorId) {
            Alert.alert('Error', 'No se pudo obtener el operador actual.');
            return;
        }

        if (!pagoSeleccionado) {
            Alert.alert('Pago requerido', 'Selecciona un pago aprobado para generar la factura.');
            return;
        }

        if (
            !cedula.trim() ||
            !nombre.trim() ||
            !apellido.trim() ||
            !telefono.trim() ||
            !correo.trim()
        ) {
            Alert.alert(
                'Campos incompletos',
                'Completa cédula, nombre, apellido, teléfono y correo.'
            );
            return;
        }

        try {
            setLoadingFactura(true);

            const { data: facturaExistente, error: facturaExistenteError } = await supabase
                .from('facturas')
                .select('id')
                .eq('pago_id', pagoSeleccionado.id)
                .maybeSingle();

            if (facturaExistenteError) {
                console.log(facturaExistenteError.message);
                Alert.alert('Error', 'No se pudo validar si la factura ya existe.');
                return;
            }

            if (facturaExistente) {
                Alert.alert(
                    'Factura existente',
                    'Este pago ya tiene una factura generada.'
                );
                return;
            }

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
                    subtotal: Number(pagoSeleccionado.valor || 0),
                    descuento: Number(pagoSeleccionado.descuento || 0),
                    total: Number(pagoSeleccionado.total || 0),
                    estado: 'emitida',
                });

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo generar la factura.');
                return;
            }

            Alert.alert(
                'Factura generada',
                'La factura fue emitida correctamente.',
                [
                    {
                        text: 'Aceptar',
                        onPress: () => router.replace('/operador'),
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al generar la factura.');
        } finally {
            setLoadingFactura(false);
        }
    }

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