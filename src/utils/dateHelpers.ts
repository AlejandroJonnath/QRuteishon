// (ESTE ARCHIVO CONTIENE FUNCIONES AUXILIARES DE FECHAS QUE CALCULAN LOS LÍMITES DEL MES ACTUAL PARA VERIFICAR CUPONES MENSUALES Y EVITAR DUPLICADOS)

// (Calcula las fechas de inicio fin y primer segundo del mes siguiente para rangos de búsqueda en la base de datos)
export function obtenerRangoMesActual() {
    // (Capturamos el momento exacto en que se llamó esta función)
    const ahora = new Date()

    // (Construimos el primer segundo del mes actual, es decir el día 1 a las 00 horas 00 minutos 00 segundos)
    const inicioMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
        0,
        0,
        0
    )

    // (Construimos el primer segundo del mes siguiente que sirve como límite superior del rango)
    // (Usar el día 1 del mes siguiente en vez del día 31 o 30 es más confiable porque JavaScript maneja los desbordamientos automáticamente)
    const inicioSiguienteMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        1,
        0,
        0,
        0
    )

    // (Construimos el último segundo del mes actual, es decir el día 0 del mes siguiente que equivale al último día del mes)
    // (El día 0 en JavaScript significa el último día del mes anterior lo cual es perfecto para nuestro fin de mes)
    const finMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        0,
        23,
        59,
        59
    )

    // (Devolvemos las tres fechas en un objeto para que el código que nos llama las use con nombres claros)
    return {
        inicioMes,
        inicioSiguienteMes,
        finMes,
    }
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas obtenerRangoMesActual el hook de cupones del operador no podrá calcular en qué rango de fechas buscar y la verificación de cupón mensual fallará)
(si se eliminan los valores devueltos como inicioMes o inicioSiguienteMes las consultas de base de datos usarán fechas undefined y traerán resultados incorrectos o vacíos)
*/
