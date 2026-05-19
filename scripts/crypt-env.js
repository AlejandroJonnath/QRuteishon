const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const TARGET_PATHS = [
    // Carpetas
    'app',
    'components',
    'context',
    'hooks',
    'lib',
    'services',
    'utils',
    'porsiacaso',
    'assets',
    // Archivos
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
const algorithm = 'aes-256-cbc';

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function packPaths() {
    const packed = {};
    let totalFiles = 0;
    TARGET_PATHS.forEach(item => {
        const itemPath = path.join(__dirname, '..', item);
        if (fs.existsSync(itemPath)) {
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                const files = getAllFiles(itemPath);
                files.forEach(file => {
                    const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
                    const content = fs.readFileSync(file).toString('base64');
                    packed[relativePath] = content;
                    totalFiles++;
                });
            } else if (stat.isFile()) {
                const relativePath = item.replace(/\\/g, '/');
                const content = fs.readFileSync(itemPath).toString('base64');
                packed[relativePath] = content;
                totalFiles++;
            }
        }
    });
    return packed;
}

function deletePaths() {
    TARGET_PATHS.forEach(item => {
        // Excluimos Bloquear.bat de la eliminacion automatica de Node para evitar EBUSY
        if (item === 'Bloquear.bat') return;

        const itemPath = path.join(__dirname, '..', item);
        if (fs.existsSync(itemPath)) {
            try {
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                    console.log(`[ELIMINADO] Carpeta: ${item}`);
                } else if (stat.isFile()) {
                    fs.unlinkSync(itemPath);
                    console.log(`[ELIMINADO] Archivo: ${item}`);
                }
            } catch (err) {
                console.warn(`[ADVERTENCIA] No se pudo eliminar completamente '${item}'. Detalle: ${err.message}`);
            }
        }
    });
}

function unpackPaths(packed) {
    Object.keys(packed).forEach(relativePath => {
        const fullPath = path.join(__dirname, '..', relativePath);
        const dirName = path.dirname(fullPath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }
        const buffer = Buffer.from(packed[relativePath], 'base64');
        fs.writeFileSync(fullPath, buffer);
    });
}

function verifyMandatoryPaths() {
    const mandatory = ['app', 'components', 'package.json'];
    const missing = [];
    mandatory.forEach(item => {
        const itemPath = path.join(__dirname, '..', item);
        if (!fs.existsSync(itemPath)) {
            missing.push(item);
        }
    });
    return missing;
}

function encrypt(password) {
    console.log("=== INICIANDO PROCESO DE CIFRADO DEL ENTORNO ===");
    
    // Validacion de seguridad: Evitar cifrar si faltan carpetas clave
    const missing = verifyMandatoryPaths();
    if (missing.length > 0) {
        console.error(`\n[ERROR CRÍTICO DE SEGURIDAD] Cifrado cancelado.`);
        console.error(`Faltan elementos esenciales en el disco para realizar el cifrado: ${missing.join(', ')}`);
        console.error(`Esto significa que el entorno ya está bloqueado o le faltan carpetas críticas.`);
        console.error(`Para evitar sobrescribir el archivo de seguridad 'src.enc' con un estado vacío o incompleto, el proceso ha sido abortado.`);
        process.exit(5);
    }

    const packedData = packPaths();
    const fileCount = Object.keys(packedData).length;

    if (fileCount === 0) {
        console.error("[ERROR] No se encontraron archivos para cifrar en las carpetas origen.");
        process.exit(1);
    }

    const jsonString = JSON.stringify(packedData);
    const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
    
    // Generar clave de 256 bits mediante SHA-256 del password
    const key = crypto.createHash('sha256').update(password).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
    const outputBuffer = Buffer.concat([iv, encrypted]);
    
    const outputPath = path.join(__dirname, '..', 'src.enc');
    fs.writeFileSync(outputPath, outputBuffer);
    
    // PRUEBA DE INTEGRIDAD AUTO-VERIFICABLE
    try {
        const testInput = fs.readFileSync(outputPath);
        const testIv = testInput.subarray(0, 16);
        const testEncrypted = testInput.subarray(16);
        const testDecipher = crypto.createDecipheriv(algorithm, key, testIv);
        const testDecrypted = Buffer.concat([testDecipher.update(testEncrypted), testDecipher.final()]);
        const testDecompressed = zlib.gunzipSync(testDecrypted);
        const testParsed = JSON.parse(testDecompressed.toString('utf-8'));
        
        if (Object.keys(testParsed).length !== fileCount) {
            throw new Error("El número de archivos verificados no coincide.");
        }
    } catch (err) {
        console.error("[ERROR CRÍTICO] La prueba de integridad falló. Cifrado abortado.");
        console.error(err.message);
        process.exit(1);
    }

    console.log(`[VERIFICADO] Cifrado e integridad probada al 100%.`);
    console.log(`[PROCESANDO] Eliminando carpetas y archivos de código fuente para asegurar el entorno...`);
    
    deletePaths();

    console.log(`\n=== ENTORNO CIFRADO CON ÉXITO ===`);
    console.log(`Clave utilizada: ${password}`);
    console.log(`Archivo generado: src.enc (${outputBuffer.length} bytes)`);
    console.log(`Archivos protegidos: ${fileCount}`);
}

function decrypt(password) {
    console.log("=== INICIANDO PROCESO DE DESCIFRADO DEL ENTORNO ===");
    const inputPath = path.join(__dirname, '..', 'src.enc');
    if (!fs.existsSync(inputPath)) {
        console.error("[ERROR] El archivo cifrado 'src.enc' no existe en la raíz del proyecto.");
        process.exit(1);
    }
    
    const inputBuffer = fs.readFileSync(inputPath);
    if (inputBuffer.length < 17) {
        console.error("[ERROR] El archivo 'src.enc' está corrupto o incompleto.");
        process.exit(1);
    }
    
    const iv = inputBuffer.subarray(0, 16);
    const encrypted = inputBuffer.subarray(16);
    const key = crypto.createHash('sha256').update(password).digest();
    
    let decrypted;
    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (e) {
        console.error("[ERROR] Clave de descifrado incorrecta.");
        process.exit(2); // Código 2 indica clave incorrecta
    }
    
    let packedData;
    try {
        const decompressed = zlib.gunzipSync(decrypted);
        packedData = JSON.parse(decompressed.toString('utf-8'));
    } catch (e) {
        console.error("[ERROR] Error al descomprimir o parsear los datos recuperados.");
        process.exit(3);
    }
    
    unpackPaths(packedData);
    
    console.log(`\n=== ENTORNO DESCIFRADO CON ÉXITO ===`);
    console.log(`Archivos restaurados: ${Object.keys(packedData).length}`);
}

const args = process.argv.slice(2);
const command = args[0];
const password = args[1];

if (!password) {
    console.error("[ERROR] Se requiere proporcionar una clave de seguridad.");
    process.exit(4);
}

if (command === 'encrypt') {
    encrypt(password);
} else if (command === 'decrypt') {
    decrypt(password);
} else {
    console.log("Uso: node crypt-env.js [encrypt|decrypt] [clave]");
}
