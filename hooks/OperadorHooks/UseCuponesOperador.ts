import { useCallback, useEffect, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { useAuth } from '../../context/AuthContext';
import { CuponesService } from '../../services/CuponesService';
import { obtenerRangoMesActual } from '../../utils/dateHelpers';

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

    const cargarCupones = useCallback(async () => {
        if (!operadorId) return;

        try {
            setLoadingData(true);

            // Buscamos los cupones desde el servicio en vez de hacer la query acá directo
            const { data, error } = await CuponesService.obtenerCuponesDisponibles(operadorId, 'operador');

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudieron cargar los cupones');
                return;
            }

            setCupones((data || []) as CuponOperador[]);
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones');
        } finally {
            setLoadingData(false);
        }
    }, [operadorId]);

    useEffect(() => {
        cargarCupones();
    }, [cargarCupones]);

    async function crearCuponMensual() {
        if (!operadorId) {
            CustomAlert.alert('Error', 'No se pudo obtener el operador actual');
            return;
        }

        try {
            setLoadingCrear(true);

            // Traemos las fechas exactitas con nuestro helper para no complicarnos acá
            const { inicioMes, inicioSiguienteMes, finMes } = obtenerRangoMesActual();

            // Preguntamos al servicio si ya creó un cupón este mes
            const { data: cuponExistente, error: existeError } = await CuponesService.verificarCuponMesActual(
                operadorId, 
                inicioMes, 
                inicioSiguienteMes
            );

            if (existeError) {
                console.log(existeError.message);
                CustomAlert.alert('Error', 'No se pudo validar el cupón mensual');
                return;
            }

            if (cuponExistente) {
                CustomAlert.alert(
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

            const datosCupon = {
                codigo,
                propietario_id: operadorId,
                propietario_rol: 'operador',
                tipo_descuento: 'porcentaje',
                valor_descuento: 5,
                uso_unico: true,
                estado: 'disponible',
                usado_en_pago_id: null,
                expira_en: finMes.toISOString(),
            };

            // Mandamos a crearlo usando el servicio
            const { error } = await CuponesService.crearCupon(datosCupon);

            if (error) {
                console.log(error.message);
                CustomAlert.alert('Error', 'No se pudo crear el cupón mensual');
                return;
            }

            CustomAlert.alert('Cupón creado', `Se creó tu cupón mensual: ${codigo}`);

            await cargarCupones();
        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al crear el cupón');
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