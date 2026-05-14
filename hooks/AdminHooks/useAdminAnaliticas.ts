import { useCallback, useEffect, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { AdminService } from '../../services/AdminService';

export type PagoReciente = {
    id: string;
    total: number;
    tipo_gasolina: string;
    pagado_en: string;
};

export type RecargaReciente = {
    id: string;
    monto: number;
    metodo: string;
    created_at: string;
};

export function useAdminAnaliticas() {
    const [pagos, setPagos] = useState<PagoReciente[]>([]);
    const [recargas, setRecargas] = useState<RecargaReciente[]>([]);
    
    // (Métricas calculadas en memoria)
    const [ingresosPagos, setIngresosPagos] = useState(0);
    const [ingresosRecargas, setIngresosRecargas] = useState(0);

    const [loadingData, setLoadingData] = useState(true);

    const cargarAnaliticas = useCallback(async () => {
        try {
            setLoadingData(true);

            // Traemos el historial de transacciones desde el servicio
            const data = await AdminService.obtenerDetallesAnaliticas();

            if (data.error) {
                console.log(data.error.message);
                CustomAlert.alert('Error', 'No se pudieron cargar las analíticas.');
                return;
            }

            const pagosLista = (data.pagos || []) as PagoReciente[];
            const recargasLista = (data.recargas || []) as RecargaReciente[];

            setPagos(pagosLista);
            setRecargas(recargasLista);

            // Calculamos cuánto dinero se ha movido
            const totalPagos = pagosLista.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
            const totalRecargas = recargasLista.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

            setIngresosPagos(totalPagos);
            setIngresosRecargas(totalRecargas);

        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar las analíticas.');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        cargarAnaliticas();
    }, [cargarAnaliticas]);

    return {
        pagos,
        recargas,
        ingresosPagos,
        ingresosRecargas,
        loadingData,
        cargarAnaliticas,
    };
}
