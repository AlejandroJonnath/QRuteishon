// (ESTE ARCHIVO CONTIENE LAS REGLAS DE VALIDACIÓN CENTRALIZADAS QUE SE APLICAN EN TODOS LOS FORMULARIOS DE LA APP PARA GARANTIZAR QUE LOS DATOS LLEGUEN LIMPIOS A LA BASE DE DATOS)

// (Valida que el correo tenga el formato estándar con arroba y dominio)
export function validarCorreo(correo: string): boolean {
    // (Esta expresión regular verifica que el correo tenga algo antes del arroba algo en el medio y algo después del punto)
    // (Por ejemplo acepta holacorreo@hotmail.com pero rechaza simplemente hola o hola@)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // (test() devuelve true si el correo cumple el patrón y false si no lo cumple)
    return emailRegex.test(correo.trim())
}

// (Valida que el número de teléfono tenga exactamente 10 dígitos numéricos sin más ni menos)
export function validarTelefono(telefono: string): boolean {
    // (d{10} significa exactamente 10 dígitos del 0 al 9, el acento circunflejo y el signo de dólar aseguran que no haya nada más)
    const telRegex = /^\d{10}$/
    return telRegex.test(telefono.trim())
}

// (Valida que la cédula tenga exactamente 10 dígitos numéricos sin letras ni símbolos)
export function validarCedula(cedula: string): boolean {
    // (Misma lógica que el teléfono exactamente 10 dígitos del 0 al 9 y nada más)
    const cedulaRegex = /^\d{10}$/
    return cedulaRegex.test(cedula.trim())
}

/*
Problemas que se pueden generar si quitan funciones:
(si quitas validarCorreo los formularios dejarán pasar correos inventados como hola o @@ y Supabase puede fallar al crear la cuenta o el usuario no recibirá nada)
(si quitas validarTelefono la app aceptará teléfonos de 3 dígitos o de 15 dígitos que no existen y la base recibirá basura)
(si quitas validarCedula podrán ingresarse cédulas de cualquier longitud incluyendo letras rompiendo las reglas del sistema de identidad)
*/
