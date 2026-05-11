export function obtenerRangoMesActual() {
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
