import * as Crypto from 'expo-crypto';

// (ESTE ARCHIVO GENERA CÓDIGOS ÚNICOS IRREPETIBLES QUE SE USAN COMO TOKENS DENTRO DE LOS CÓDIGOS QR DE COBRO)

// (Genera un token único combinando el tiempo actual con letras y números aleatorios)
export function generarTokenQr() {
    // (Generamos un sufijo aleatorio de 6 caracteres convirtiéndolo a base 36 que usa letras y números)
    const random = Crypto.randomUUID().split('-')[0].toUpperCase().substring(0, 6)
    // (Combinamos el prefijo oficial la marca de tiempo actual en milisegundos y el sufijo aleatorio)
    // (Date.now() garantiza que el número de millisegundos siempre sea diferente haciendo el token prácticamente irrepetible)
    return `QRUTA-${Date.now()}-${random}`
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas generarTokenQr no habrá forma de crear el token que va dentro del QR y el operador no podrá generar ningún cobro nuevo)
*/
