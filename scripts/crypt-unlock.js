// Importa el modulo del sistema de archivos nativo de Node (para poder leer y escribir archivos y carpetas en el disco)
const fs = require('fs');
// Importa el modulo para manejar y resolver rutas de archivos de forma compatible entre sistemas operativos
const path = require('path');
// Importa el modulo de compresion nativo (para poder comprimir y descomprimir los datos usando el algoritmo GZIP)
const zlib = require('zlib');
// Importa el modulo de criptografia nativo (para poder realizar operaciones de hashing SHA-256 y cifrado AES-256-CBC)
const crypto = require('crypto');
// Importa las configuraciones compartidas desde el archivo de configuracion
const { algorithm } = require('./crypt-config');

// SECCION
// Este archivo contiene unicamente la logica necesaria para desencriptar el entorno, siendo llamado directamente por Desbloquear.bat.

// FUNCION: unpackPaths
// Sirve para tomar el objeto JSON de archivos descifrados y recrear en el disco la estructura de carpetas original y escribir en cada ruta su contenido correspondiente binario
function unpackPaths(packed) {
    // Itera secuencialmente sobre todas las llaves (rutas relativas de archivos) presentes en el objeto empaquetado
    Object.keys(packed).forEach(relativePath => {
        // Construye la ruta absoluta de destino final combinando la raiz del proyecto y la ruta relativa del archivo
        const fullPath = path.join(__dirname, '..', relativePath);
        // Extrae la ruta de la carpeta que contendra al archivo actual
        const dirName = path.dirname(fullPath);
        // Si la carpeta de destino no existe en el disco duro
        if (!fs.existsSync(dirName)) {
            // Crea de forma recursiva todas las carpetas intermedias necesarias en el disco
            fs.mkdirSync(dirName, { recursive: true });
        }
        // Convierte el contenido codificado en Base64 de vuelta a un buffer binario nativo de Node
        const buffer = Buffer.from(packed[relativePath], 'base64');
        // Escribe de forma sincrona los bytes en la ruta absoluta final recreando el archivo original
        fs.writeFileSync(fullPath, buffer);
    });
}

// FUNCION: decrypt
// Sirve para descifrar el archivo src.enc utilizando la contraseña del usuario restaurando todas las carpetas originales en el disco en menos de 150 milisegundos
function decrypt(password) {
    // Muestra el inicio formal del proceso de restauracion y descifrado
    console.log("=== INICIANDO PROCESO DE DESCIFRADO DEL ENTORNO ===");
    // Resuelve la ubicacion absoluta del archivo de seguridad src.enc en la raiz
    const inputPath = path.join(__dirname, '..', 'src.enc');
    // Verifica si el archivo encriptado existe en el disco duro
    if (!fs.existsSync(inputPath)) {
        // Si no existe, muestra un error informativo
        console.error("[ERROR] El archivo cifrado 'src.enc' no existe en la raíz del proyecto.");
        // Sale del script de Node
        process.exit(1);
    }

    // Lee por completo el archivo cifrado src.enc a memoria
    const inputBuffer = fs.readFileSync(inputPath);
    // Comprueba que el archivo leido tenga al menos 17 bytes (16 bytes del IV y minimo 1 byte de datos cifrados)
    if (inputBuffer.length < 17) {
        // Muestra un mensaje indicando corrupcion del archivo
        console.error("[ERROR] El archivo 'src.enc' está corrupto o incompleto.");
        // Sale del script con codigo de error
        process.exit(1);
    }

    // Extrae los primeros 16 bytes que corresponden al Vector de Inicializacion
    const iv = inputBuffer.subarray(0, 16);
    // Extrae el bloque de datos cifrados restante
    const encrypted = inputBuffer.subarray(16);
    // Aplica un hash SHA-256 a la clave proporcionada por el usuario para generar la llave de descifrado
    const key = crypto.createHash('sha256').update(password).digest();

    // Inicializa la variable que contendra los bytes desencriptados
    let decrypted;
    // Abre un bloque de captura de errores para manejar claves incorrectas de forma segura
    try {
        // Instancia el descifrador de Node con la clave y el IV correspondientes
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        // Descifra los datos binarios uniendo la parte intermedia y el residuo del bloque final
        decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        // Captura fallas de padding o integridad (lo que ocurre cuando la contraseña es incorrecta)
    } catch (e) {
        // Informa que la clave de descifrado es incorrecta
        console.error("[ERROR] Clave de descifrado incorrecta.");
        // Sale de Node con el codigo de estado 2 (el cual le indica al script bat que muestre la interfaz roja de error)
        process.exit(2);
    }

    // Inicializa la variable que contendra los archivos mapeados en memoria
    let packedData;
    // Abre un bloque de captura de errores para la descompresion GZIP y parsing JSON
    try {
        // Descomprime el buffer binario recuperado para obtener el JSON original en texto plano
        const decompressed = zlib.gunzipSync(decrypted);
        // Decodifica la cadena de texto UTF-8 a un objeto JSON indexado
        packedData = JSON.parse(decompressed.toString('utf-8'));
        // Captura cualquier falla producida en la descompresion (como datos corruptos)
    } catch (e) {
        // Muestra un mensaje detallando el fallo en el parseo
        console.error("[ERROR] Error al descomprimir o parsear los datos recuperados.");
        // Termina el script de Node con codigo de estado 3
        process.exit(3);
    }

    // Recrea los directorios y archivos originales en el disco duro
    unpackPaths(packedData);

    // Informa que el entorno ha sido descifrado y restaurado con exito total
    console.log(`\n=== ENTORNO DESCIFRADO CON ÉXITO ===`);
    console.log(`Archivos restaurados: ${Object.keys(packedData).length}`);
}

// Obtiene los argumentos pasados por consola a la ejecucion de Node omitiendo las rutas internas del ejecutable
const args = process.argv.slice(2);
// Recupera el primer argumento que contiene la contraseña escrita por el usuario en la terminal
const password = args[0];

// Si la clave no fue proporcionada en la llamada por consola
if (!password) {
    // Muestra en la terminal que es obligatorio ingresar una clave
    console.error("[ERROR] Se requiere proporcionar una clave de seguridad.");
    // Sale de Node con el codigo de salida 4
    process.exit(4);
}

// Ejecuta directamente la logica de desencriptacion
decrypt(password);

// ANÁLISIS DE PROBLEMAS SI SE QUITAN LAS FUNCIONES:
// "si quitas la funcion unpackPaths pasa que al introducir la clave correcta el descifrador no escribira ningun archivo en tu disco (dejando el entorno eternamente oculto en src.enc)"
// "si quitas la funcion decrypt pasa que jamas podras volver a leer tu codigo fuente en texto plano desde el archivo src.enc (quedando el proyecto bloqueado permanentemente bajo llave)"
