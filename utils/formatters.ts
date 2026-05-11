export function extraerToken(data: string) {
    try {
        const parsed = JSON.parse(data);

        if (parsed.qr_token) return String(parsed.qr_token).trim();
        if (parsed.token) return String(parsed.token).trim();

        return data.trim();
    } catch {
        return data.trim();
    }
}

export function obtenerMontoNumerico(montoEnTexto: string) {
    return Number(montoEnTexto.replace(',', '.'));
}
