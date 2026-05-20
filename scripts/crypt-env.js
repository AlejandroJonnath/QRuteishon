const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

// SECCION
// Este archivo de codigo sirve como el motor criptografico del proyecto realizando la lectura recursiva compresion y cifrado AES-256-CBC de todos los archivos sensibles para guardarlos en un solo archivo protegido y asimismo realiza la operacion contraria para restaurarlos en su sitio original en disco

// Define el listado de todas las carpetas y archivos criticos del entorno que deben ser protegidos y posteriormente purgados del disco
const TARGET_PATHS = [
    'app',
    'components',
    'context',
    'hooks',
    'lib',
    'services',
    'utils',
    'porsiacaso',
    'assets',
    '.env',
    'app.json',
    'eslint.config.js',
    'expo-env.d.ts',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'supabase.md',
    'supabase_rls_policies.txt',
    'Bloquear.bat'
];
// Configura el algoritmo de cifrado simetrico estandar de la industria con clave de 256 bits y encadenamiento de bloques
const algorithm = 'aes-256-cbc';

// FUNCION: getAllFiles
// Sirve para recorrer recursivamente una carpeta y obtener de forma secuencial las rutas de todos los archivos contenidos en ella y en sus respectivas subcarpetas
function getAllFiles(dirPath, arrayOfFiles = []) {
    // Retorna la lista acumulada inmediatamente si el directorio buscado no existe en el almacenamiento fisico (evitando errores de lectura)
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    // Lee la lista de nombres de archivos y carpetas contenidos en el directorio especificado de forma sincrona
    const files = fs.readdirSync(dirPath);

    // Itera secuencialmente sobre cada elemento encontrado en la carpeta leida
    files.forEach(file => {
        // Construye la ruta absoluta correspondiente al elemento actual combinando la ruta base y el nombre
        const fullPath = path.join(dirPath, file);
        // Verifica si el elemento analizado actualmente corresponde a un directorio fisico en el disco
        if (fs.statSync(fullPath).isDirectory()) {
            // Invoca recursivamente a la propia funcion para continuar buscando archivos dentro de esa subcarpeta
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            // Añade la ruta del archivo encontrado al final del arreglo acumulativo
            arrayOfFiles.push(fullPath);
        }
    });

    // Devuelve el arreglo de rutas absolutas recopilado a lo largo de toda la recursión
    return arrayOfFiles;
}

// FUNCION: packPaths
// Sirve para compilar todos los archivos de los directorios indicados convirtiendo sus contenidos a formato Base64 y agrupandolos en un unico objeto JSON indexado por su ruta relativa
function packPaths() {
    // Inicializa un objeto vacio que servira de contenedor para asociar rutas con sus contenidos en texto plano
    const packed = {};
    // Lleva la cuenta del numero total de archivos procesados y agregados al paquete final
    let totalFiles = 0;
    // Itera uno por uno los elementos predefinidos en la lista de rutas a proteger
    TARGET_PATHS.forEach(item => {
        // Construye la ruta absoluta hacia el archivo o directorio a procesar subiendo un nivel desde la carpeta de scripts
        const itemPath = path.join(__dirname, '..', item);
        // Comprueba si el archivo o carpeta buscado existe actualmente en el disco duro
        if (fs.existsSync(itemPath)) {
            // Obtiene los metadatos y estado del archivo o directorio (tamaño, tipo, etc.)
            const stat = fs.statSync(itemPath);
            // Comprueba si la ruta evaluada es un directorio
            if (stat.isDirectory()) {
                // Obtiene de forma recursiva todos los archivos pertenecientes a esa carpeta
                const files = getAllFiles(itemPath);
                // Procesa cada archivo individual encontrado dentro de la carpeta
                files.forEach(file => {
                    // Calcula la ruta relativa del archivo respecto a la raiz del proyecto reemplazando barras invertidas de Windows por diagonales normales
                    const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
                    // Lee el contenido binario del archivo y lo convierte a una cadena de texto en formato Base64 (para prevenir corrupciones)
                    const content = fs.readFileSync(file).toString('base64');
                    // Almacena el contenido leido en el objeto contenedor asociandolo a su ruta relativa
                    packed[relativePath] = content;
                    // Incrementa en uno el contador general de archivos empaquetados
                    totalFiles++;
                });
            // Si no es un directorio, evalua si es un archivo individual en la raiz
            } else if (stat.isFile()) {
                // Genera la ruta relativa del archivo en la raiz limpiando los separadores de ruta
                const relativePath = item.replace(/\\/g, '/');
                // Lee el archivo individual y lo codifica a formato seguro Base64
                const content = fs.readFileSync(itemPath).toString('base64');
                // Inserta el archivo y su contenido en el diccionario del paquete
                packed[relativePath] = content;
                // Incrementa en uno el contador
                totalFiles++;
            }
        }
    });
    // Devuelve el objeto JSON conteniendo todo el arbol de archivos y sus codificaciones
    return packed;
}

// FUNCION: deletePaths
// Sirve para eliminar del disco de forma definitiva todos los archivos y carpetas locales en claro tras haberse verificado que su cifrado fue 100 por ciento exitoso
function deletePaths() {
    // Recorre de forma secuencial el arreglo de elementos configurados para su purga
    TARGET_PATHS.forEach(item => {
        // Omite expresamente el borrado del script de bloqueo en esta etapa (para evitar errores EBUSY del proceso bat de Windows)
        if (item === 'Bloquear.bat') return;

        // Resuelve la ruta absoluta hacia el archivo o directorio a eliminar
        const itemPath = path.join(__dirname, '..', item);
        // Verifica si la ruta a borrar existe fisicamente en el almacenamiento
        if (fs.existsSync(itemPath)) {
            // Abre un bloque de captura de errores para evitar que un bloqueo de archivo detenga la limpieza del resto
            try {
                // Obtiene la informacion de estado del elemento para discriminar entre carpeta y archivo
                const stat = fs.statSync(itemPath);
                // Si corresponde a una carpeta
                if (stat.isDirectory()) {
                    // Elimina recursivamente la carpeta y todo su contenido de forma forzada sin pedir confirmaciones
                    fs.rmSync(itemPath, { recursive: true, force: true });
                    // Imprime en la consola el nombre de la carpeta que ha sido removida
                    console.log(`[ELIMINADO] Carpeta: ${item}`);
                // Si en cambio corresponde a un archivo en la raiz
                } else if (stat.isFile()) {
                    // Borra de forma definitiva el archivo del sistema
                    fs.unlinkSync(itemPath);
                    // Informa en la consola la eliminacion del archivo correspondiente
                    console.log(`[ELIMINADO] Archivo: ${item}`);
                }
            // Captura cualquier error producido en el proceso de eliminacion (como permisos insuficientes o archivos bloqueados EBUSY)
            } catch (err) {
                // Emite una advertencia informativa detallando que elemento no se pudo borrar (dejando continuar el script)
                console.warn(`[ADVERTENCIA] No se pudo eliminar completamente '${item}'. Detalle: ${err.message}`);
            }
        }
    });
}

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

// FUNCION: verifyMandatoryPaths
// Sirve para validar previamente que las carpetas y archivos fundamentales existan en disco antes de encriptar (evitando destruir la copia de seguridad por error)
function verifyMandatoryPaths() {
    // Define el listado de carpetas y archivos minimos que deben estar en claro en el disco antes de permitir el cifrado
    const mandatory = ['app', 'components', 'package.json'];
    // Inicializa un arreglo que guardara aquellos elementos que hagan falta en el disco
    const missing = [];
    // Itera y verifica la existencia de cada elemento clave
    mandatory.forEach(item => {
        // Resuelve la ubicacion absoluta del elemento obligatorio en el disco
        const itemPath = path.join(__dirname, '..', item);
        // Si el elemento no existe en el disco duro
        if (!fs.existsSync(itemPath)) {
            // Agrega el nombre del elemento faltante al arreglo de elementos perdidos
            missing.push(item);
        }
    });
    // Retorna el arreglo conteniendo los nombres de las carpetas o archivos que hacen falta
    return missing;
}

// FUNCION: encrypt
// Sirve para empaquetar comprimir y encriptar mediante algoritmos seguros todo el codigo del entorno de desarrollo realizando ademas pruebas de integridad antes de purgar el disco
function encrypt(password) {
    // Muestra en la pantalla de la consola el inicio formal de la operacion de cifrado y empaquetado
    console.log("=== INICIANDO PROCESO DE CIFRADO DEL ENTORNO ===");
    
    // Ejecuta la validacion de rutas obligatorias para prevenir el borrado accidental de una copia de seguridad en uso
    const missing = verifyMandatoryPaths();
    // Si hace falta algun elemento esencial (indicando que el entorno ya podria estar bloqueado)
    if (missing.length > 0) {
        // Imprime un mensaje informativo indicando la cancelacion critica del cifrado
        console.error(`\n[ERROR CRÍTICO DE SEGURIDAD] Cifrado cancelado.`);
        // Muestra cuales elementos hicieron falta en el disco de desarrollo
        console.error(`Faltan elementos esenciales en el disco para realizar el cifrado: ${missing.join(', ')}`);
        // Explica detalladamente al desarrollador la causa del problema
        console.error(`Esto significa que el entorno ya está bloqueado o le faltan carpetas críticas.`);
        // Advierte que la cancelacion previene la perdida total de datos por sobrescritura de la boveda
        console.error(`Para evitar sobrescribir el archivo de seguridad 'src.enc' con un estado vacío o incompleto, el proceso ha sido abortado.`);
        // Termina el script de Node retornando el codigo de salida 5 (que indica cancelacion por seguridad)
        process.exit(5);
    }

    // Compila los archivos y directorios del entorno en un objeto JSON Base64
    const packedData = packPaths();
    // Obtiene la cantidad de archivos que han sido empaquetados en el objeto
    const fileCount = Object.keys(packedData).length;

    // Si el total de archivos compilados es igual a 0 (lo cual no deberia ocurrir)
    if (fileCount === 0) {
        // Muestra un error de ejecucion por falta de archivos
        console.error("[ERROR] No se encontraron archivos para cifrar en las carpetas origen.");
        // Sale del script de Node
        process.exit(1);
    }

    // Convierte el diccionario JSON de archivos en una cadena de texto estructurada
    const jsonString = JSON.stringify(packedData);
    // Comprime el string JSON en formato binario usando GZIP (para reducir considerablemente el tamaño final)
    const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
    
    // Aplica un hash SHA-256 a la contraseña escrita por el usuario para generar una clave simetrica estable y segura de 256 bits
    const key = crypto.createHash('sha256').update(password).digest();
    // Genera un Vector de Inicializacion (IV) aleatorio y unico de 16 bytes (para asegurar que cada cifrado sea diferente)
    const iv = crypto.randomBytes(16);
    
    // Instancia el objeto cifrador usando el algoritmo AES-256 en modo CBC con la clave y el vector generados
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Ejecuta el cifrado de los datos comprimidos concatenando el cuerpo de datos y la cola del bloque final
    const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
    // Junta el Vector de Inicializacion de 16 bytes y los datos encriptados en un unico buffer de salida
    const outputBuffer = Buffer.concat([iv, encrypted]);
    
    // Resuelve la ubicacion absoluta donde se escribira el archivo encriptado final en la raiz del proyecto
    const outputPath = path.join(__dirname, '..', 'src.enc');
    // Escribe fisicamente en el disco duro el buffer encriptado resultante
    fs.writeFileSync(outputPath, outputBuffer);
    
    // Inicia una prueba automatica de descifrado en memoria (fail-safe) para asegurar que el archivo src.enc generado funciona a la perfección
    try {
        // Lee directamente el archivo encriptado recien escrito en el disco
        const testInput = fs.readFileSync(outputPath);
        // Extrae los primeros 16 bytes que corresponden al Vector de Inicializacion
        const testIv = testInput.subarray(0, 16);
        // Extrae el bloque de datos cifrados restante
        const testEncrypted = testInput.subarray(16);
        // Crea un descifrador con los mismos parametros de clave e IV
        const testDecipher = crypto.createDecipheriv(algorithm, key, testIv);
        // Descifra los bytes de prueba concatenando el resultado intermedio y final
        const testDecrypted = Buffer.concat([testDecipher.update(testEncrypted), testDecipher.final()]);
        // Descomprime los bytes usando GZIP para recuperar el string original
        const testDecompressed = zlib.gunzipSync(testDecrypted);
        // Decodifica el texto recuperado de vuelta a un objeto JSON
        const testParsed = JSON.parse(testDecompressed.toString('utf-8'));
        
        // Verifica si la cantidad de archivos descifrados coincide exactamente con la cantidad original empaquetada
        if (Object.keys(testParsed).length !== fileCount) {
            // Lanza un error si hay diferencias en los elementos
            throw new Error("El número de archivos verificados no coincide.");
        }
    // Captura cualquier fallo ocurrido durante el proceso de prueba de integridad
    } catch (err) {
        // Informa que la prueba fallo y que por seguridad se detiene el borrado de las carpetas locales
        console.error("[ERROR CRÍTICO] La prueba de integridad falló. Cifrado abortado.");
        // Muestra en la consola el detalle exacto del error criptografico
        console.error(err.message);
        // Detiene la ejecucion del proceso con codigo de salida 1 (previniendo la perdida de tus archivos)
        process.exit(1);
    }

    // Informa que el test de integridad fue un exito absoluto y que la copia es viable
    console.log(`[VERIFICADO] Cifrado e integridad probada al 100%.`);
    // Avisa que procedera a vaciar el espacio de trabajo local para proteger el codigo
    console.log(`[PROCESANDO] Eliminando carpetas y archivos de código fuente para asegurar el entorno...`);
    
    // Llama a la funcion para eliminar fisicamente las carpetas locales en claro
    deletePaths();

    // Muestra en pantalla el resumen de la encriptacion exitosa del entorno
    console.log(`\n=== ENTORNO CIFRADO CON ÉXITO ===`);
    console.log(`Clave utilizada: ${password}`);
    console.log(`Archivo generado: src.enc (${outputBuffer.length} bytes)`);
    console.log(`Archivos protegidos: ${fileCount}`);
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
// Recupera el primer argumento que indica la accion a realizar (encrypt o decrypt)
const command = args[0];
// Recupera el segundo argumento que contiene la contraseña escrita por el usuario en la terminal
const password = args[1];

// Si la clave no fue proporcionada en la llamada por consola
if (!password) {
    // Muestra en la terminal que es obligatorio ingresar una clave
    console.error("[ERROR] Se requiere proporcionar una clave de seguridad.");
    // Sale de Node con el codigo de salida 4
    process.exit(4);
}

// Si la accion solicitada corresponde a encriptar
if (command === 'encrypt') {
    // Invoca a la funcion de encriptacion pasandole la contraseña
    encrypt(password);
// Si la accion solicitada corresponde a desencriptar
} else if (command === 'decrypt') {
    // Invoca a la funcion de descifrado pasandole la contraseña
    decrypt(password);
// En caso de que se pase un comando no soportado por consola
} else {
    // Muestra la guia de uso correcto de la consola
    console.log("Uso: node crypt-env.js [encrypt|decrypt] [clave]");
}

// ANÁLISIS DE PROBLEMAS SI SE QUITAN LAS FUNCIONES:
// si quitas la funcion getAllFiles pasa que el empaquetador no podra explorar el interior de las subcarpetas del proyecto (como app/ o components/) provocando que el archivo src.enc quede vacio y perdiendo todo tu codigo fuente
// si quitas la funcion packPaths pasa que el motor no recopilara ningun archivo de tu computadora y el comando de bloqueo fallara lanzando un error por falta de datos para cifrar
// si quitas la funcion deletePaths pasa que los archivos y carpetas sensibles continuaran expuestos en tu disco duro despues de encriptar (anulando el proposito de proteccion del sistema)
// si quitas la funcion unpackPaths pasa que al introducir la clave correcta el descifrador no escribira ningun archivo en tu disco (dejando el entorno eternamente oculto en src.enc)
// si quitas la funcion verifyMandatoryPaths pasa que el script no validara la presencia de carpetas esenciales (permitiendo que un doble clic accidental en Bloquear.bat cuando el proyecto ya esta cerrado sobrescriba tu boveda real con una vacia destruyendo tu codigo para siempre)
// si quitas la funcion encrypt pasa que el sistema sera incapaz de empaquetar comprimir y cifrar tus archivos con AES-256 impidiendo cerrar el entorno para subirlo seguro a GitHub
// si quitas la funcion decrypt pasa que jamas podras volver a leer tu codigo fuente en texto plano desde el archivo src.enc (quedando el proyecto bloqueado permanentemente bajo llave)
