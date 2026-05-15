// (ESTE ARCHIVO CONTIENE FUNCIONES AUXILIARES PARA TRANSFORMAR Y LIMPIAR DATOS ANTES DE USARLOS EN LA APP)

// (Esta función extrae el token limpio desde el texto crudo que escaneó la cámara del QR)
export function extraerToken(data: string) {
    try {
        // (Intentamos parsear el texto como si fuera JSON porque el QR puede venir en ese formato)
        const parsed = JSON.parse(data)

        // (Si el JSON tiene un campo qr_token lo devolvemos limpio sin espacios)
        if (parsed.qr_token) return String(parsed.qr_token).trim()
        // (Si tiene un campo genérico token también lo aceptamos)
        if (parsed.token) return String(parsed.token).trim()

        // (Si el JSON no tiene ninguno de esos campos devolvemos el texto completo limpio)
        return data.trim()
    } catch {
        // (Si el texto no era JSON válido simplemente devolvemos el texto tal cual pero limpio)
        return data.trim()
    }
}

// (Esta función convierte el texto que escribe el usuario en los campos de monto a un número real)
// (Acepta tanto punto como coma como separador decimal para no dejar fuera a los hispanohablantes)
export function obtenerMontoNumerico(montoEnTexto: string) {
    // (Reemplazamos la coma por punto para que JavaScript pueda convertirlo a número)
    return Number(montoEnTexto.replace(',', '.'))
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas extraerToken la cámara escaneará el QR pero el token vendrá sucio o en formato incorrecto y la búsqueda del pago siempre fallará)
(si quitas obtenerMontoNumerico los campos de monto no podrán convertirse a número y todos los cálculos de precio devolverán NaN)
*/
