import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AdminService } from '../../services/AdminService';
import { generarTokenQr } from '../../utils/generators'; // Usaremos esto también para generar códigos aleatorios
import { obtenerRangoMesActual } from '../../utils/dateHelpers';

export type CuponGlobal = {
    id: string;
    codigo: string;
    propietario_id: string | null;
    propietario_rol: string | null;
    tipo_descuento: 'monto' | 'porcentaje';
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    expira_en: string | null;
    created_at: string;
};

export function useAdminCupones() {
    const [cupones, setCupones] = useState<CuponGlobal[]>([]);
    
    // Estados para la generación manual/automática
    const [cantidad, setCantidad] = useState('1');
    const [tipoDescuento, setTipoDescuento] = useState<'monto' | 'porcentaje'>('monto');
    const [valorDescuento, setValorDescuento] = useState('');
    const [diasValidez, setDiasValidez] = useState('30');
    
    const [loadingData, setLoadingData] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    const cargarCupones = useCallback(async () => {
        try {
            setLoadingData(true);

            const { data, error } = await AdminService.obtenerTodosLosCupones();

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los cupones.');
                return;
            }

            setCupones((data || []) as CuponGlobal[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones.');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        cargarCupones();
    }, [cargarCupones]);

    async function generarLoteCupones() {
        const cant = parseInt(cantidad, 10);
        const val = parseFloat(valorDescuento);
        const dias = parseInt(diasValidez, 10);

        if (isNaN(cant) || cant <= 0 || cant > 100) {
            Alert.alert('Cantidad inválida', 'Puedes generar entre 1 y 100 cupones a la vez.');
            return;
        }

        if (isNaN(val) || val <= 0) {
            Alert.alert('Valor inválido', 'El descuento debe ser mayor a 0.');
            return;
        }

        if (isNaN(dias) || dias < 1) {
            Alert.alert('Días inválidos', 'El cupón debe durar al menos 1 día.');
            return;
        }

        try {
            setLoadingAction(true);

            const fechaExpiracion = new Date();
            fechaExpiracion.setDate(fechaExpiracion.getDate() + dias);

            // Creamos la lista de cupones a insertar
            const cuponesNuevos = Array.from({ length: cant }).map(() => ({
                // Usamos nuestro generator y le agregamos un prefijo ADMIN
                codigo: `ADMIN-${generarTokenQr().split('-')[2]}`,
                propietario_id: null, // Cupones globales que cualquiera puede usar
                propietario_rol: null,
                tipo_descuento: tipoDescuento,
                valor_descuento: val,
                uso_unico: true,
                estado: 'disponible',
                expira_en: fechaExpiracion.toISOString(),
            }));

            const { error } = await AdminService.generarCuponesAutomaticos(cuponesNuevos);

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron generar los cupones.');
                return;
            }

            Alert.alert('Cupones generados', `Se crearon exitosamente ${cant} cupones.`);
            
            // Limpiamos form
            setCantidad('1');
            setValorDescuento('');
            
            await cargarCupones();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al generar los cupones.');
        } finally {
            setLoadingAction(false);
        }
    }

    async function cambiarEstadoCupon(id: string, nuevoEstado: string) {
        try {
            setLoadingAction(true);

            const { error } = await AdminService.cambiarEstadoCupon(id, nuevoEstado);

            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo cambiar el estado del cupón.');
                return;
            }

            await cargarCupones();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cambiar el estado.');
        } finally {
            setLoadingAction(false);
        }
    }

    return {
        cupones,
        cantidad,
        setCantidad,
        tipoDescuento,
        setTipoDescuento,
        valorDescuento,
        setValorDescuento,
        diasValidez,
        setDiasValidez,
        loadingData,
        loadingAction,
        cargarCupones,
        generarLoteCupones,
        cambiarEstadoCupon,
    };
}
