// Importa el modulo del sistema de archivos nativo de Node (para poder leer y escribir archivos y carpetas en el disco)
const fs = require('fs');
// Importa el modulo para manejar y resolver rutas de archivos de forma compatible entre sistemas operativos
const path = require('path');

// SECCION
// Este archivo contiene la configuración compartida y funciones auxiliares para el proceso de cifrado y descifrado.

// Define el listado de carpetas y archivos que seran procesados por el motor criptografico
const TARGET_PATHS = [
    // Representa la carpeta que contiene las vistas y pantallas principales basadas en Expo Router
    'app',
    // Representa la carpeta principal que contiene todo el codigo fuente de la aplicacion (componentes, servicios, contextos, utils, etc)
    'src',
    // Representa la carpeta local de respaldos de seguridad que tambien sera encriptada
    'maintenance', // Anteriormente porsiacaso, actualizada a maintenance
    // Representa la carpeta que contiene las imagenes y recursos estaticos de la aplicacion
    'assets',
    // Representa el archivo de configuracion de variables de entorno local
    '.env',
    // Archivo de ignorados especifico de EAS
    '.easignore',
    // Archivo de configuracion de EAS Build
    'eas.json',
    // Representa el archivo de configuracion global de la aplicacion Expo
    'app.json',
    // Representa el archivo de configuracion de reglas de estilo de linter ESLint
    'eslint.config.js',
    // Representa el archivo de definiciones de variables de entorno de TypeScript de Expo
    'expo-env.d.ts',
    // Representa el archivo de manifiesto de dependencias de Node
    'package.json',
    // Representa el archivo que bloquea y registra las versiones exactas de las dependencias
    'package-lock.json',
    // Representa el archivo de configuracion del compilador de TypeScript
    'tsconfig.json',
    // Representa la guia de documentacion sobre la base de datos Supabase
    'supabase.md',
    // Representa los scripts de auditoria OWASP creados recientemente
    'owasp_auditor.py',
    // Representa el script de Windows para cifrar que se auto-eliminara tras terminar
    'Bloquear.bat'
];

// Configura el algoritmo de cifrado simetrico estandar de la industria con clave de 256 bits y encadenamiento de bloques
const algorithm = 'aes-256-cbc';

// Exporta las constantes para que puedan ser usadas por los scripts de bloqueo y desbloqueo
module.exports = {
    // Exporta la lista de rutas objetivo
    TARGET_PATHS,
    // Exporta el nombre del algoritmo criptografico
    algorithm
};

// ANÁLISIS DE PROBLEMAS SI SE QUITAN LAS FUNCIONES:
// "si quitas TARGET_PATHS pasa que el sistema no sabrá qué archivos respaldar o borrar, rompiendo todo el proceso."
// "si quitas el algorithm pasa que fallará la inicialización criptográfica en los scripts de lock y unlock."
