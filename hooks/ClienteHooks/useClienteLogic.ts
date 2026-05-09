import { router, type Href } from 'expo-router';
import { useRequireRole } from '../useRequireRole';
import { useAuth } from '../../context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';


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

            const { data: billeteraData, error: billeteraError } = await supabase
                .from('billeteras')
                .select('id, usuario_id, numero_tarjeta, saldo, estado, created_at')
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (billeteraError) {
                Alert.alert('Error', 'No se pudo cargar la billetera.');
                console.log(billeteraError.message);
                return;
            }

            setBilletera(billeteraData as Billetera | null);

            const { data: movimientosData, error: movimientosError } = await supabase
                .from('movimientos')
                .select('id, usuario_id, tipo, descripcion, monto, estado, referencia_id, created_at')
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (movimientosError) {
                Alert.alert('Error', 'No se pudieron cargar los movimientos.');
                console.log(movimientosError.message);
                return;
            }

            setMovimientos((movimientosData || []) as Movimiento[]);

            const { data: cuponesData, error: cuponesError } = await supabase
                .from('cupones')
                .select('id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en, created_at')
                .eq('propietario_id', usuarioId)
                .eq('propietario_rol', 'cliente')
                .eq('estado', 'disponible')
                .order('created_at', { ascending: false });

            if (cuponesError) {
                Alert.alert('Error', 'No se pudieron cargar los cupones.');
                console.log(cuponesError.message);
                return;
            }

            setCupones((cuponesData || []) as Cupon[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar el panel.');
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
