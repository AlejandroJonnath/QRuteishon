import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export type CuponOperador = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: 'monto' | 'porcentaje';
    valor_descuento: number;
    uso_unico: boolean;
    estado: 'disponible' | 'usado' | 'vencido';
    usado_en_pago_id: string | null;
    expira_en: string | null;
    created_at: string;
};

export function useCuponesOperador() {
    const { session } = useAuth();

    const [cupones, setCupones] = useState<CuponOperador[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingCrear, setLoadingCrear] = useState(false);

    const operadorId = session?.user?.id;

    function obtenerRangoMesActual() {
        const ahora = new Date();

        const inicioMes = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            1,
            0,
            0,
            0
        );

        const inicioSiguienteMes = new Date(
            ahora.getFullYear(),
            ahora.getMonth() + 1,
            1,
            0,
            0,
            0
        );

        const finMes = new Date(
            ahora.getFullYear(),
            ahora.getMonth() + 1,
            0,
            23,
            59,
            59
        );

        return {
            inicioMes,
            inicioSiguienteMes,
            finMes,
        };
    }

    const cargarCupones = useCallback(async () => {
        if (!operadorId) return;

        try {
            setLoadingData(true);

            const { data, error } = await supabase
                .from('cupones')
                .select(
                    'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en, created_at'
                )
                .eq('propietario_id', operadorId)
                .eq('propietario_rol', 'operador')
                .order('created_at', { ascending: false });

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los cupones.');
                return;
            }

            setCupones((data || []) as CuponOperador[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones.');
        } finally {
            setLoadingData(false);
        }
    }, [operadorId]);

    useEffect(() => {
        cargarCupones();
    }, [cargarCupones]);

    async function crearCuponMensual() {
        if (!operadorId) {
            Alert.alert('Error', 'No se pudo obtener el operador actual.');
            return;
        }

        try {
            setLoadingCrear(true);

            const { inicioMes, inicioSiguienteMes, finMes } = obtenerRangoMesActual();

            const { data: cuponExistente, error: existeError } = await supabase
                .from('cupones')
                .select('id, codigo, created_at')
                .eq('propietario_id', operadorId)
                .eq('propietario_rol', 'operador')
                .gte('created_at', inicioMes.toISOString())
                .lt('created_at', inicioSiguienteMes.toISOString())
                .maybeSingle();

            if (existeError) {
                console.log(existeError.message);
                Alert.alert('Error', 'No se pudo validar el cupón mensual.');
                return;
            }

            if (cuponExistente) {
                Alert.alert(
                    'Cupón ya creado',
                    `Ya tienes un cupón asignado este mes: ${cuponExistente.codigo}`
                );
                return;
            }

            const ahora = new Date();
            const anio = ahora.getFullYear();
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();

            const codigo = `QRUTA-OP-${anio}${mes}-${random}`;

            const { error } = await supabase
                .from('cupones')
                .insert({
                    codigo,
                    propietario_id: operadorId,
                    propietario_rol: 'operador',
                    tipo_descuento: 'porcentaje',
                    valor_descuento: 5,
                    uso_unico: true,
                    estado: 'disponible',
                    usado_en_pago_id: null,
                    expira_en: finMes.toISOString(),
                });

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo crear el cupón mensual.');
                return;
            }

            Alert.alert(
                'Cupón creado',
                `Se creó tu cupón mensual: ${codigo}`
            );

            await cargarCupones();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al crear el cupón.');
        } finally {
            setLoadingCrear(false);
        }
    }

    return {
        cupones,
        loadingData,
        loadingCrear,
        cargarCupones,
        crearCuponMensual,
    };
}