import { router, type Href } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { BilleteraService } from '../../services/BilleteraService';
import { CuponesService } from '../../services/CuponesService';

type Billetera = {
    id: string;
    usuario_id: string;
    numero_tarjeta: string;
    saldo: number;
    estado: string;
    created_at: string;
};

type Movimiento = {
    id: string;
    usuario_id: string;
    tipo: string;
    descripcion: string | null;
    monto: number;
    estado: string;
    referencia_id: string | null;
    created_at: string;
};

type Cupon = {
    id: string;
    codigo: string;
    propietario_id: string;
    propietario_rol: string;
    tipo_descuento: string;
    valor_descuento: number;
    uso_unico: boolean;
    estado: string;
    usado_en_pago_id: string | null;
    expira_en: string | null;
    created_at: string;
};

export function useClienteLogic() {
    const { session, perfil, signOut } = useAuth();

    const [billetera, setBilletera] = useState<Billetera | null>(null);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const usuarioId = session?.user?.id;

    const cargarDatosCliente = useCallback(async () => {
        if (!usuarioId) return;

        try {
            setLoadingData(true);

            // Buscamos su billetera
            const { data: billeteraData, error: billeteraError } = await BilleteraService.obtenerBilletera(usuarioId);

            if (billeteraError) {
                Alert.alert('Error', 'No se pudo cargar la billetera');
                console.log(billeteraError.message);
                return;
            }

            setBilletera(billeteraData as Billetera | null);

            // Traemos los últimos 5 movimientos
            const { data: movimientosData, error: movimientosError } = await BilleteraService.obtenerUltimosMovimientos(usuarioId, 5);

            if (movimientosError) {
                Alert.alert('Error', 'No se pudieron cargar los movimientos');
                console.log(movimientosError.message);
                return;
            }

            setMovimientos((movimientosData || []) as Movimiento[]);

            // Y los cupones que tenga listos para usar
            const { data: cuponesData, error: cuponesError } = await CuponesService.obtenerCuponesDisponibles(usuarioId, 'cliente');

            if (cuponesError) {
                Alert.alert('Error', 'No se pudieron cargar los cupones');
                console.log(cuponesError.message);
                return;
            }

            setCupones((cuponesData || []) as Cupon[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar el panel');
        } finally {
            setLoadingData(false);
        }
    }, [usuarioId]);

    useEffect(() => {
        cargarDatosCliente();
    }, [cargarDatosCliente]);

    async function handleLogout() {
        await signOut();
        router.replace('/login');
    }

    // Funciones cortitas para que la UI no se ensucie con lógica de navegación
    function irARecargar() {
        router.push('/cliente/recargar' as Href);
    }

    function irAPagarQr() {
        router.push('/cliente/pagar-qr' as Href);
    }

    return {
        perfil,
        billetera,
        movimientos,
        cupones,
        loadingData,
        cargarDatosCliente,
        handleLogout,
        irARecargar,
        irAPagarQr,
    };
}
