export function generarTokenQr() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `QRUTA-${Date.now()}-${random}`;
}
