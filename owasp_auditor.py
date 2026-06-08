import os
import re
import json

# Definición de las variables globales del script
# DIRECTORIES_TO_SCAN contiene las carpetas comunes en un proyecto React Native donde se buscará código fuente
DIRECTORIES_TO_SCAN = ['app', 'components', 'lib', 'services', 'utils', 'context', 'hooks', 'api']
# CODE_EXTENSIONS define qué extensiones de archivo se considerarán como código fuente para el análisis (React y TypeScript)
CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']
# DB_EXTENSIONS especifica qué extensiones se analizarán en busca de posibles vulnerabilidades de base de datos
DB_EXTENSIONS = ['.sql', '.txt', '.schema']

# Clase que representa una regla de vulnerabilidad específica
# Se utiliza para instanciar cada regla con su nombre categoría severidad descripción y patrón de búsqueda regex
class Vulnerability:
    # Método inicializador de la clase Vulnerability
    # Recibe parámetros para configurar la regla incluyendo si aplica a base de datos (is_db)
    def __init__(self, category, name, severity, description, regex, is_db=False):
        # Asigna la categoría de la vulnerabilidad (ejemplo OWASP-A03)
        self.category = category
        # Asigna el nombre descriptivo de la vulnerabilidad
        self.name = name
        # Asigna el nivel de severidad (CRITICAL HIGH MEDIUM LOW)
        self.severity = severity
        # Asigna una descripción detallada del problema y cómo resolverlo
        self.description = description
        # Asigna la expresión regular compilada que buscará el patrón vulnerable en el código
        self.regex = regex
        # Booleano que indica si esta regla aplica solo a archivos de base de datos o esquemas
        self.is_db = is_db

# Lista global que almacena todas las instancias de reglas de vulnerabilidad a aplicar
# A03:2021 - INYECCIÓN (SQL NoSQL y XSS)
# Reglas que detectan construcción insegura de consultas e inyección de código
RULES = [
    # Inyección SQL clásica en el cliente (concatenación de cadenas)
    Vulnerability(
        "OWASP-A03-INJECTION", "Posible Inyección SQL en Cliente", "HIGH",
        "Consulta SQL construida con variables concatenadas en código cliente Usa métodos seguros del ORM o SDK",
        re.compile(r'(SELECT|INSERT|UPDATE|DELETE)\s+.*?\s+(FROM|INTO)\s+.*?\+', re.IGNORECASE)
    ),
    # Inyección en bases de datos NoSQL como MongoDB
    Vulnerability(
        "OWASP-A03-NOSQL-INJECTION", "Posible Inyección NoSQL (MongoDB/Otros)", "HIGH",
        "Paso directo de objetos del cliente (ej req.query req.body) a consultas NoSQL sin validación previa (puede permitir inyección de operadores $ne $gt)",
        re.compile(r'(db\.[a-zA-Z0-9_]+\.(find|findOne|update|delete)\s*\(\s*req\.(query|body|params))')
    ),
    # Llamadas a funciones remotas o RPC (ej Supabase Postgres)
    Vulnerability(
        "OWASP-A03-INJECTION", "Llamada a RPC/Procedimiento Almacenado (Supabase/PG)", "MEDIUM",
        "Llamada a función RPC Verifica que el backend no concatene SQL internamente y use parámetros seguros ($1)",
        re.compile(r'(supabase\.rpc\(|\.execute\()')
    ),
    # Detección de Cross-Site Scripting (XSS) en React/Webviews
    Vulnerability(
        "OWASP-A03-XSS", "Uso de dangerouslySetInnerHTML (XSS)", "CRITICAL",
        "Propiedad que inyecta HTML directo Permite ejecución de scripts maliciosos si el origen no está sanitizado",
        re.compile(r'dangerouslySetInnerHTML')
    ),
    # Inyección de código dinámica
    Vulnerability(
        "OWASP-A03-INJECTION", "Uso de eval() o setTimeout con strings", "CRITICAL",
        "Ejecución dinámica de código Permite RCE (Remote Code Execution) Inyección directa de JavaScript",
        re.compile(r'\beval\s*\(|setTimeout\s*\(\s*[\'"`]')
    ),
    # INYECCIONES EN ARCHIVOS DE BASE DE DATOS
    # Reglas específicas para detectar problemas en scripts SQL o de migración
    # SQL dinámico ejecutado directamente
    Vulnerability(
        "OWASP-A03-DB-INJECTION", "SQL Dinámico Inseguro (EXECUTE format/concatenación)", "CRITICAL",
        "SQL dinámico ejecutado en la base de datos Riesgo crítico si se concatenan variables externas",
        re.compile(r'EXECUTE\s+\'|EXECUTE\s+\S+\s*\|\|', re.IGNORECASE),
        is_db=True
    ),
    
    # A01:2021 - CONTROL DE ACCESO ROTO (BROKEN ACCESS CONTROL)
    # Reglas para identificar políticas excesivamente permisivas
    # RLS abierto en Supabase o PostgreSQL
    Vulnerability(
        "OWASP-A01-BROKEN-ACCESS", "Política RLS o Accesos Excesivamente Permisivos", "CRITICAL",
        "Política de base de datos que permite acceso a todos (USING true) Verifica si los datos deben ser verdaderamente públicos",
        re.compile(r'USING\s*\(\s*true\s*\)|WITH\s+CHECK\s*\(\s*true\s*\)', re.IGNORECASE),
        is_db=True
    ),
    
    # A07:2021 - FALLAS DE IDENTIFICACIÓN Y AUTENTICACIÓN
    # Reglas para evitar filtración de credenciales
    # Credenciales en texto claro
    Vulnerability(
        "OWASP-A07-SECRETS", "Secretos Hardcodeados en el Código", "CRITICAL",
        "Credenciales o tokens incrustados en el fuente Usa variables de entorno (.env) o KeyStores seguras",
        re.compile(r'(api_key|apikey|token|password|secret|bearer_token|auth_key)\s*[:=]\s*[\'"][a-zA-Z0-9_\-\.]{8,}[\'"]', re.IGNORECASE)
    ),
    # Llave maestra de Supabase expuesta
    Vulnerability(
        "OWASP-A07-SUPABASE-SERVICE", "Supabase Service Role Key o JWT Privado Expuesto", "CRITICAL",
        "Llave que omite reglas RLS filtrada en el frontend Nunca exponer llaves maestras en aplicaciones clientes",
        re.compile(r'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+')
    ),

    # OWASP MOBILE TOP 10 (M1 a M10)
    # Categorías específicas para seguridad en aplicaciones móviles
    
    # M1: Uso inadecuado de credenciales y plataformas
    Vulnerability(
        "OWASP-M1-PLATFORM", "Exportación de Componentes Inseguros (Android)", "HIGH",
        "Verifica que Intents o Activities no estén expuestas globalmente sin permisos (esto es una revisión teórica para el archivo de manifiesto si estuviera incluido)",
        re.compile(r'android:exported\s*=\s*["\']true["\']'),
        is_db=False 
    ),
    # M2: Almacenamiento de datos inseguro (Insecure Data Storage)
    Vulnerability(
        "OWASP-M2-INSECURE-STORAGE", "Uso de AsyncStorage/SharedPreferences para Datos Sensibles", "MEDIUM",
        "AsyncStorage guarda datos en texto plano Los atacantes con acceso físico pueden robar JWTs Usa expo-secure-store o EncryptedSharedPreferences",
        re.compile(r'AsyncStorage\.(setItem|getItem)|localStorage\.(setItem|getItem)')
    ),
    Vulnerability(
        "OWASP-M2-INSECURE-STORAGE", "Uso de SQLite de forma insegura en móvil", "MEDIUM",
        "Almacenar datos en SQLite local sin cifrado (SQLCipher) puede exponer información PII a extracciones forenses",
        re.compile(r'SQLite\.openDatabase')
    ),
    # M3: Comunicación Insegura (Insecure Communication)
    Vulnerability(
        "OWASP-M3-INSECURE-COMMS", "Comunicación HTTP sin cifrar", "HIGH",
        "Uso de http:// en lugar de https:// Permite interceptación y ataques Man-in-the-Middle (MITM)",
        re.compile(r'[\'"]http://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}')
    ),
    # M4: Autenticación Insegura (Insecure Authentication)
    Vulnerability(
        "OWASP-M4-INSECURE-AUTH", "Autenticación local biométrica débil", "MEDIUM",
        "Uso de biometría sin fallback criptográfico seguro o de validación de servidor",
        re.compile(r'LocalAuthentication\.authenticateAsync')
    ),
    # M5: Criptografía Insuficiente (Insufficient Cryptography)
    Vulnerability(
        "OWASP-M5-INSECURE-CRYPTO", "Uso de generadores pseudoaleatorios débiles", "MEDIUM",
        "Math.random() no es seguro para criptografía o UUIDs Usa módulos crypto robustos (expo-crypto o webcrypto)",
        re.compile(r'Math\.random\(\)')
    ),
    Vulnerability(
        "OWASP-M5-INSECURE-CRYPTO", "Uso de algoritmos de hash obsoletos (MD5/SHA1)", "HIGH",
        "MD5 y SHA1 tienen colisiones conocidas Usa SHA-256 o superior",
        re.compile(r'(md5\(|sha1\()', re.IGNORECASE)
    ),
    # M7: Calidad del Código del Cliente (Client Code Quality)
    Vulnerability(
        "OWASP-M7-CLIENT-CODE", "Filtrado de datos en logs de consola", "LOW",
        "Imprimir datos de depuración en consola puede filtrar datos sensibles al log del sistema (logcat) accesible por otras apps",
        re.compile(r'console\.(log|warn|error|info)\(.*(password|token|secret|key|user|email).*\)', re.IGNORECASE)
    ),
    # M8: Alteración del Código (Code Tampering) / Ingeniería Inversa
    Vulnerability(
        "OWASP-M8-REVERSE-ENGINEERING", "Lógica sensible en el cliente (Calculos de precio/roles)", "MEDIUM",
        "Condicionales de rol como isAdmin en el frontend pueden ser parcheados (Ingeniería inversa) La validación final SIEMPRE debe ir en backend",
        re.compile(r'(isAdmin|role\s*===\s*[\'"]admin[\'"]|price\s*=)')
    )
]

# Clase principal del script que orquesta la auditoría
# Recorre el sistema de archivos aplica las reglas e imprime el reporte final
class Auditor:
    # Método inicializador de la clase Auditor
    # Configura el directorio raíz a escanear y las estadísticas del proceso
    def __init__(self, root_dir):
        # Asigna el directorio raíz desde el cual comenzar el escaneo
        self.root_dir = root_dir
        # Inicializa una lista vacía para almacenar las vulnerabilidades detectadas
        self.findings = []
        # Contador de archivos de código (React TS) analizados
        self.scanned_files = 0
        # Contador de archivos relacionados con bases de datos o esquemas analizados
        self.scanned_db_files = 0

    # Método para escanear un archivo individual línea por línea
    # Verifica cada línea contra las expresiones regulares de las reglas aplicables
    def scan_file(self, file_path, is_db_file=False):
        # Bloque try-except para manejar errores al abrir o leer archivos (por ejemplo problemas de permisos o codificación no utf-8)
        try:
            # Abre el archivo en modo lectura con codificación UTF-8
            with open(file_path, 'r', encoding='utf-8') as f:
                # Lee todas las líneas del archivo en una lista
                lines = f.readlines()
                # Itera sobre las líneas enumerándolas desde la línea 1
                for line_number, line in enumerate(lines, 1):
                    # Por cada línea itera sobre todas las reglas definidas en la lista global RULES
                    for rule in RULES:
                        # Condición para filtrar reglas: aplica reglas de base de datos a archivos de base de datos y reglas de código a archivos de código
                        if (is_db_file and rule.is_db) or (not is_db_file and not rule.is_db):
                            # Ejecuta la búsqueda de la expresión regular de la regla en la línea actual
                            match = rule.regex.search(line)
                            # Si se encuentra una coincidencia (se detectó un patrón vulnerable)
                            if match:
                                # Filtro específico para reducir falsos positivos en variables de entorno (process.env) en la regla de secretos
                                if rule.category == "OWASP-A07-SECRETS" and "process.env" in line:
                                    # Salta esta iteración (continúa con la siguiente regla) si es un falso positivo
                                    continue
                                
                                # Agrega un diccionario con la información del hallazgo a la lista de findings
                                self.findings.append({
                                    # Ruta relativa del archivo eliminando la ruta raíz
                                    "file": file_path.replace(self.root_dir, ""),
                                    # Referencia a la regla vulnerada
                                    "rule": rule,
                                    # Número de línea donde se encontró
                                    "line": line_number,
                                    # Muestra solo los primeros 150 caracteres de la línea limpia para evidencia (evita imprimir líneas enteras minificadas)
                                    "content": line.strip()[:150]
                                })
        # Captura cualquier excepción al procesar el archivo
        except Exception as e:
            # Ignora la excepción silenciosamente (útil para saltar archivos binarios o con errores de codificación que os.walk pueda recoger)
            pass

    # Método principal para ejecutar el escaneo completo
    # Muestra el encabezado inicia los recorridos y luego llama a la generación del reporte
    def run(self):
        # Imprime la cabecera visual del inicio de la ejecución del script
        print("  OWASP AUDITOR EXHAUSTIVO - Mobile, Web y Multi-DB Analyzer")
        
        # Fase 1: Escaneo del código fuente frontend y backend (Node/React/React Native)
        print("[*] Analizando código fuente en busca de vulnerabilidades (XSS, Storage, Secrets, Auth, Crypto)")
        # Itera sobre los directorios configurados globalmente
        for directory in DIRECTORIES_TO_SCAN:
            # Construye la ruta completa uniendo la raíz y el nombre del directorio
            dir_path = os.path.join(self.root_dir, directory)
            # Verifica si el directorio existe; si no salta al siguiente
            if not os.path.exists(dir_path): continue
            
            # Utiliza os.walk para recorrer recursivamente todos los subdirectorios y archivos
            for root, _, files in os.walk(dir_path):
                # Itera sobre cada archivo encontrado en el directorio actual
                for file in files:
                    # Verifica si el archivo termina en alguna de las extensiones de código permitidas
                    if any(file.endswith(ext) for ext in CODE_EXTENSIONS):
                        # Incrementa el contador global de archivos de código analizados
                        self.scanned_files += 1
                        # Llama a la función de escaneo pasando la ruta completa indicando que no es un archivo de base de datos
                        self.scan_file(os.path.join(root, file), is_db_file=False)

        # Fase 2: Escaneo de archivos relacionados con bases de datos (SQL, NoSQL Schemas, RLS)
        print("[*] Analizando archivos de base de datos y esquemas (SQL Injection, Broken Access Control)")
        # Recorre todo el directorio raíz recursivamente
        for root, _, files in os.walk(self.root_dir):
            # Filtra carpetas que no deben analizarse (dependencias, repositorios git o temporales de expo)
            if "node_modules" in root or ".git" in root or ".expo" in root: continue
            # Itera sobre los archivos de la ruta actual
            for file in files:
                # Verifica si el archivo termina en alguna extensión definida como de base de datos
                if any(file.endswith(ext) for ext in DB_EXTENSIONS):
                    # Agrega un filtro extra por nombre de archivo para asegurar que sea de base de datos o esquemas
                    if "supabase" in file.lower() or "sql" in file.lower() or "schema" in file.lower() or "policies" in file.lower() or "mongo" in file.lower():
                        # Incrementa el contador global de archivos de base de datos analizados
                        self.scanned_db_files += 1
                        # Llama al método de escaneo marcando el archivo como de base de datos
                        self.scan_file(os.path.join(root, file), is_db_file=True)

        # Llama a la función que agrupa e imprime los resultados del escaneo
        self.generate_report()

    # Método que formatea e imprime los resultados de las vulnerabilidades encontradas
    # Imprime advertencias por nivel de severidad e instrucciones de remediación
    def generate_report(self):
        # Imprime título de sección del reporte
        print(" REPORTE DE AUDITORIA ")
        
        # Condicional: si la lista de hallazgos está vacía
        if not self.findings:
            # Imprime mensaje de éxito indicando que no se encontraron problemas
            print(f"\n[OK] AUDITORIA SUPERADA No se encontraron vulnerabilidades evidentes")
            # Imprime total de archivos de código fuente procesados
            print(f"Archivos de codigo analizados {self.scanned_files}")
            # Imprime total de archivos de base de datos procesados
            print(f"Archivos de base de datos analizados {self.scanned_db_files}")
            # Imprime descargo de responsabilidad (las pruebas estáticas no detectan todo)
            print("\nNota Una auditoria estatica no reemplaza las pruebas de penetracion dinamicas (DAST/Pentesting)")
            # Termina la ejecución de este método
            return

        # Si hubo hallazgos imprime la cantidad total de vulnerabilidades detectadas
        print(f"\n[X] SE ENCONTRARON {len(self.findings)} POSIBLES VULNERABILIDADES")
        
        # Diccionario que asocia el nivel de severidad con una etiqueta en color o de texto
        severity_colors = {"CRITICAL": "[CRITICAL]", "HIGH": "[HIGH]", "MEDIUM": "[MEDIUM]", "LOW": "[LOW]"}
        
        # Diccionario que asigna un valor numérico a las severidades para poder ordenarlas de más grave a menos grave
        order = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
        # Ordena la lista de hallazgos usando la severidad de la regla como criterio de ordenamiento
        sorted_findings = sorted(self.findings, key=lambda x: order.get(x['rule'].severity, 5))

        # Itera sobre los hallazgos ya ordenados
        for finding in sorted_findings:
            # Extrae la regla vulnerada del hallazgo para acortar el código
            r = finding['rule']
            # Imprime la etiqueta de severidad el nombre y la categoría (ejemplo [CRITICAL] Secretos Expuestos (OWASP-A07))
            print(f"\n{severity_colors.get(r.severity, '[INFO]')} [{r.severity}] {r.name} ({r.category})")
            # Imprime la ubicación exacta del hallazgo (archivo y número de línea)
            print(f"   Archivo .{finding['file']} (Linea {finding['line']})")
            # Imprime la descripción o instrucción de cómo remediar el hallazgo
            print(f"   Detalle {r.description}")
            # Muestra un fragmento del código fuente donde se detectó el problema
            print(f"   Evidencia {finding['content']}")

        # Imprime resumen final de estadísticas
        print(f"Archivos analizados Codigo ({self.scanned_files}) | Base de Datos ({self.scanned_db_files})")
        # Imprime cabecera para las sugerencias de remediación
        print("\nINSTRUCCIONES PARA APROBAR LA AUDITORIA")
        # Instrucción sobre las severidades altas
        print("1 Revisa las advertencias etiquetadas como CRITICAL y HIGH y corrigelas inmediatamente")
        # Instrucción específica para inyecciones en diferentes bases de datos (añade MongoDB y Supabase)
        print("2 Para Inyecciones (SQL/NoSQL) Asegurate de usar consultas parametrizadas o los metodos seguros de los SDK correspondientes (Mongoose Supabase SDK)")
        # Instrucción sobre políticas en bases de datos gestionadas o PostgreSQL
        print("3 Para Control de Acceso Evita exponer roles maestros y asegura politicas estrictas en tu RLS o capas de middlewares")
        # Instrucción sobre desarrollo móvil OWASP Mobile Top 10
        print("4 Para Aplicaciones Moviles Nunca almacenes tokens o datos PII en AsyncStorage/SharedPreferences Usa un KeyStore seguro y encripta datos locales")

# Bloque de ejecución principal del script de Python
# Verifica si el script se está ejecutando directamente (y no siendo importado)
if __name__ == "__main__":
    # Instancia la clase Auditor pasándole el directorio actual (donde se ejecuta el script)
    # y ejecuta inmediatamente el método run para iniciar todo el flujo
    Auditor(os.getcwd()).run()
