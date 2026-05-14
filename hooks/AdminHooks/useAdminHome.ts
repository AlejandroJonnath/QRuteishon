import { useCallback, useEffect, useState } from 'react';
import { CustomAlert } from '../../utils/AlertManager';

import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { AdminService } from '../../services/AdminService';

export function useAdminHome() {
    const { perfil, signOut } = useAuth();

    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [totalClientes, setTotalClientes] = useState(0);
    const [totalOperadores, setTotalOperadores] = useState(0);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [totalPagos, setTotalPagos] = useState(0);
    const [totalRecargas, setTotalRecargas] = useState(0);
    const [totalCupones, setTotalCupones] = useState(0);
    const [loadingData, setLoadingData] = useState(true);

    const cargarResumen = useCallback(async () => {
        try {
            setLoadingData(true);

            // Delegamos la carga masiva al servicio
            const data = await AdminService.obtenerTotalesDashboard();

            if (data.error) {
                console.log(data.error.message);
                CustomAlert.alert('Error', 'No se pudo cargar el resumen.');
                return;
            }

            setTotalUsuarios(data.usuarios.length);
            setTotalClientes(data.usuarios.filter((user: any) => user.rol === 'cliente').length);
            setTotalOperadores(data.usuarios.filter((user: any) => user.rol === 'operador').length);
            setTotalAdmins(data.usuarios.filter((user: any) => user.rol === 'admin').length);

            setTotalPagos(data.totalPagos);
            setTotalRecargas(data.totalRecargas);
            setTotalCupones(data.totalCupones);

        } catch (error) {
            console.log(error);
            CustomAlert.alert('Error inesperado', 'Ocurrió un problema al cargar el panel admin.');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);

    async function handleLogout() {
        await signOut();
        router.replace('/login');
    }

    return {
        perfil,
        totalUsuarios,
        totalClientes,
        totalOperadores,
        totalAdmins,
        totalPagos,
        totalRecargas,
        totalCupones,
        loadingData,
        cargarResumen,
        handleLogout,
        irClientes: () => router.push('/administrador/clientes' as any),
        irOperadores: () => router.push('/administrador/operadores' as any),
        irAdministradores: () => router.push('/administrador/administradores' as any),
        irCupones: () => router.push('/administrador/cupones' as any),
        irAnaliticas: () => router.push('/administrador/analiticas' as any),
    };
}