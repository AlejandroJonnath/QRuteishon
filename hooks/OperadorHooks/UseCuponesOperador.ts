// Importamos los hooks de React que vamos a usar
import { useCallback, useEffect, useState } from 'react';
// Importamos Alert para mostrar mensajes en pantalla
import { Alert } from 'react-native';
// Nuestra conexión a la base de datos
import { supabase } from '../../lib/supabase';
// El hook de autenticación
import { useAuth } from '../../context/AuthContext';

// Así se ve un cupón de operador en la base de datos
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

// Hook para manejar todo el tema de los cupones mensuales de los operadores
export function useCuponesOperador() {
    // Sacamos la sesión actual
    const { session } = useAuth();

    // Estado para guardar la lista de cupones
    const [cupones, setCupones] = useState<CuponOperador[]>([]);
    
    // Rueditas de carga
    const [loadingData, setLoadingData] = useState(true);
    const [loadingCrear, setLoadingCrear] = useState(false);

    // Guardamos el ID del operador
    const operadorId = session?.user?.id;

    // Esta función nos sirve para saber en qué mes estamos (desde el primer segundo hasta el último segundo del mes)
    function obtenerRangoMesActual() {
        const ahora = new Date();

        // Primer día del mes a las 00:00:00
        const inicioMes = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            1,
            0,
            0,
            0
        );

        // Primer día del mes SIGUIENTE (para validar que el cupón no se pase)
        const inicioSiguienteMes = new Date(
            ahora.getFullYear(),
            ahora.getMonth() + 1,
            1,
            0,
            0,
            0
        );

        // Último día del mes a las 23:59:59 (para ponerle fecha de expiración al cupón)
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

    // Función que busca los cupones que ha creado este operador
    const cargarCupones = useCallback(async () => {
        if (!operadorId) return;

        try {
            // Prendemos la carga
            setLoadingData(true);

            // Buscamos en la tabla cupones
            const { data, error } = await supabase
                .from('cupones')
                .select(
                    'id, codigo, propietario_id, propietario_rol, tipo_descuento, valor_descuento, uso_unico, estado, usado_en_pago_id, expira_en, created_at'
                )
                // Solo traemos los que son de este operador
                .eq('propietario_id', operadorId)
                .eq('propietario_rol', 'operador')
                // Ordenamos por fecha de creación
                .order('created_at', { ascending: false });

            // Si falla la consulta a la base de datos avisamos
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudieron cargar los cupones');
                return;
            }

            // Guardamos la lista en el estado
            setCupones((data || []) as CuponOperador[]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al cargar los cupones');
        } finally {
            // Apagamos la carga
            setLoadingData(false);
        }
    }, [operadorId]);

    // Cuando recién carga este hook vamos a traer los cupones de una vez
    useEffect(() => {
        cargarCupones();
    }, [cargarCupones]);

    // Función para crear un nuevo cupón (solo pueden hacer uno por mes)
    async function crearCuponMensual() {
        if (!operadorId) {
            Alert.alert('Error', 'No se pudo obtener el operador actual');
            return;
        }

        try {
            // Prendemos el loader del botón
            setLoadingCrear(true);

            // Traemos las fechas del mes actual
            const { inicioMes, inicioSiguienteMes, finMes } = obtenerRangoMesActual();

            // Vamos a buscar si ya creó un cupón este mes
            const { data: cuponExistente, error: existeError } = await supabase
                .from('cupones')
                .select('id, codigo, created_at')
                .eq('propietario_id', operadorId)
                .eq('propietario_rol', 'operador')
                // Que sea mayor o igual al inicio del mes
                .gte('created_at', inicioMes.toISOString())
                // Y menor al inicio del siguiente mes
                .lt('created_at', inicioSiguienteMes.toISOString())
                .maybeSingle();

            if (existeError) {
                console.log(existeError.message);
                Alert.alert('Error', 'No se pudo validar el cupón mensual');
                return;
            }

            // Si ya tiene uno no lo dejamos crear otro
            if (cuponExistente) {
                Alert.alert(
                    'Cupón ya creado',
                    `Ya tienes un cupón asignado este mes: ${cuponExistente.codigo}`
                );
                return;
            }

            // Si no tiene cupón, armamos uno nuevo
            const ahora = new Date();
            const anio = ahora.getFullYear();
            // Le ponemos un 0 a la izquierda si el mes es de un solo dígito
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            // Generamos letras y números al azar para el código
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();

            // Así va a quedar el código del cupón (ejemplo: QRUTA-OP-202405-A1B2)
            const codigo = `QRUTA-OP-${anio}${mes}-${random}`;

            // Lo metemos en la base de datos
            const { error } = await supabase
                .from('cupones')
                .insert({
                    codigo,
                    propietario_id: operadorId,
                    propietario_rol: 'operador',
                    tipo_descuento: 'porcentaje',
                    // Le damos un 5% de descuento fijo
                    valor_descuento: 5,
                    uso_unico: true,
                    estado: 'disponible',
                    usado_en_pago_id: null,
                    // Hacemos que se venza a fin de mes
                    expira_en: finMes.toISOString(),
                });

            // Si no se pudo guardar avisamos
            if (error) {
                console.log(error.message);
                Alert.alert('Error', 'No se pudo crear el cupón mensual');
                return;
            }

            // Todo salió bien
            Alert.alert(
                'Cupón creado',
                `Se creó tu cupón mensual: ${codigo}`
            );

            // Actualizamos la lista para que vea su nuevo cupón
            await cargarCupones();
        } catch (error) {
            console.log(error);
            Alert.alert('Error inesperado', 'Ocurrió un problema al crear el cupón');
        } finally {
            // Apagamos la ruedita
            setLoadingCrear(false);
        }
    }

    // Exportamos para que la pantalla del operador pueda usar esto
    return {
        cupones,
        loadingData,
        loadingCrear,
        cargarCupones,
        crearCuponMensual,
    };
}