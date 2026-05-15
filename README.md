# QRuteishon 🚗⛽

QRuteishon es una aplicación innovadora diseñada para la gestión rápida y eficiente de pagos de combustible mediante códigos QR. Desarrollada con React Native y Expo, la aplicación permite a los operadores de gasolineras generar cobros que los clientes pueden escanear y pagar al instante desde su billetera virtual, todo administrado a través de un panel de control corporativo.

---

## 🚀 1. ¿Qué tengo que hacer para correr la app?

Para ejecutar QRuteishon en tu entorno local, sigue estos pasos al pie de la letra:

### Requisitos Previos:
- Tener **Node.js** instalado (se recomienda la versión LTS más reciente).
- Tener instalado **Git**.
- Una cuenta de **Supabase** (la base de datos y backend de la app).
- Un dispositivo físico con la app **Expo Go** instalada (Android o iOS) o un emulador configurado en tu PC.

### Pasos de Instalación:

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd QRuteishon
   ```

2. **Instalar las dependencias:**
   Ejecuta el siguiente comando para instalar todos los paquetes necesarios descritos en el `package.json`:
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   En la raíz del proyecto, debes crear un archivo llamado `.env` (si no existe) y colocar tus credenciales de Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL="tu-url-de-supabase"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anonima-de-supabase"
   ```

4. **Levantar el servidor de desarrollo:**
   Para arrancar la aplicación con Expo, ejecuta:
   ```bash
   npx expo start
   ```

5. **Probar la app:**
   - **En celular físico:** Escanea el código QR que aparece en la terminal usando la cámara de tu iPhone o la app de Expo Go en Android.
   - **En emulador:** Presiona `a` en la terminal para abrir en Android Emulator o `i` para abrir en el simulador de iOS.

---

## 📂 2. Todas las carpetas que existen y para qué funcionan

El proyecto sigue una arquitectura modular y separada por responsabilidades para que sea fácil de mantener y escalar. Aquí tienes la estructura completa:

- **`app/`**: Es el corazón visual de la aplicación. Utiliza `expo-router` para manejar la navegación entre pantallas. Aquí viven todas las vistas principales de la aplicación organizadas por módulos (`administrador/`, `cliente/`, `operador/`, además de pantallas sueltas como `login.tsx` e `index.tsx`).
- **`app/_styles/`**: Contiene todos los archivos de diseño (`.ts`) que le dan los colores, márgenes, sombras y la apariencia visual general (Theme Premium) a las pantallas de la carpeta `app/`.
- **`assets/`**: Contiene recursos estáticos como imágenes, fuentes personalizadas y los íconos de la aplicación que se usarán globalmente.
- **`components/`**: Aloja piezas visuales reutilizables que no son pantallas completas. Por ejemplo, `GlobalAlert.tsx` (para mostrar notificaciones bonitas) o la carpeta `auth/` (que contiene `LoginForm`, `RegisterForm`, etc.).
- **`hooks/`**: Aquí está el "cerebro" de la aplicación. Contiene funciones personalizadas de React que manejan la lógica de negocio, cálculos y estados separados de la interfaz gráfica. Están divididos por rol (`AdminHooks`, `ClienteHooks`, `OperadorHooks`, `auth`).
- **`services/`**: Es la capa de comunicación con la base de datos. Contiene los archivos (`AdminService.ts`, `AuthService.ts`, etc.) encargados exclusivamente de enviar y traer datos desde Supabase.
- **`utils/`**: Carpeta de herramientas globales de ayuda. Tiene funciones pequeñas para formatear fechas (`dateHelpers.ts`), formatear dinero (`formatters.ts`), generar PDFs (`GenerarFacturaPdf.ts`), generar tokens (`generators.ts`) y validaciones de seguridad (`validators.ts`).
- **`lib/`**: Archivos de configuración de librerías externas. Principalmente guarda `supabase.ts`, que es el archivo que inicializa la conexión con la base de datos.

---

## ⚠️ 3. Carpetas Importantes para que el contenido funcione

Aunque todas las carpetas son necesarias, hay **tres carpetas que son vitales** para que la lógica de la aplicación no colapse:

1. **`services/`**: Si esto falla, la app pierde totalmente la capacidad de leer o guardar información. La aplicación se desconectaría del mundo real.
2. **`hooks/`**: Aquí viven las reglas de negocio (ej. cómo se resta dinero de una cuenta, o cómo se verifica un rol). Sin esta carpeta, las pantallas (`app/`) serían solo dibujos sin inteligencia.
3. **`lib/`**: Especialmente el archivo `supabase.ts`. Contiene las llaves de acceso a la base de datos. Si la configuración aquí está rota, el login y todo lo demás no funcionará.

---

## 💣 4. Qué pasa si borramos o modificamos mal alguna de las carpetas

*Ten mucho cuidado al modificar la estructura de este proyecto. Aquí detallamos los desastres que ocurrirían si algo se daña:*

- **`app/`**: Si alteras el nombre de un archivo o carpeta aquí, **romperás la navegación de la aplicación por completo**. `expo-router` lee directamente estos nombres para crear las rutas (ej. si borras `app/login.tsx`, los usuarios verán un error "Not Found" al abrir la app).
- **`app/_styles/`**: Si borras o modificas mal estos archivos, **la aplicación se volverá un desastre visual**. Los botones se amontonarán, los textos serán ilegibles y perderás todo el formato corporativo y animaciones predefinidas.
- **`components/`**: Si modificas mal un componente como `GlobalAlert.tsx`, **las alertas de la aplicación dejarán de aparecer** o bloquearán la pantalla, lo que significa que el usuario no sabrá si hubo un error al pagar o si su registro fue exitoso. Si borras componentes de `auth/`, el login desaparecerá de la vista.
- **`hooks/`**: Si rompes un hook (por ejemplo, `useRequireRole.ts`), **destruirás la seguridad de la app**. Clientes podrían entrar al panel de administradores, o la aplicación entraría en un bucle infinito de carga intentando descifrar quién está logueado.
- **`services/`**: Si modificas mal los servicios (ej. `PagosService.ts`), **podrías causar pérdidas de dinero reales**. Podrías hacer que a un cliente se le cobre doble o que el pago nunca se registre en la base de datos, generando errores de "Data Null" o rompiendo las promesas asíncronas.
- **`utils/`**: Si borras `validators.ts`, la aplicación **dejará pasar datos basura** a la base de datos (correos sin arroba, cédulas con letras, números de teléfono erróneos). Si dañas `GenerarFacturaPdf.ts`, los operadores **no podrán imprimir facturas** y la app crasheará al intentar compartir archivos inexistentes.
- **`lib/`**: Si modificas mal `supabase.ts`, **toda la aplicación morirá al instante**. Ninguna llamada a la base de datos funcionará y tendrás errores 500 o de "Network Request Failed" en cada click que des.

---

## 🛠️ 5. Librerías que se utilizaron

Para que QRuteishon se vea y funcione tan bien, utilizamos herramientas de primera calidad del ecosistema moderno:

- **`expo`** (~54.0.33): El framework principal que envuelve a React Native para facilitar el desarrollo multiplataforma.
- **`expo-router`** (~6.0.23): Para el manejo de rutas, navegación por archivos e interceptación de modales.
- **`@supabase/supabase-js`** (^2.105.3): El cliente oficial para conectar la app con nuestro backend, gestionar autenticación, base de datos PostgreSQL y políticas de seguridad (RLS).
- **`react-native-reanimated`** (~4.1.1): El motor que impulsa todas las animaciones suavecitas (FadeInDown, Springify) en formularios y tarjetas.
- **`react-native-qrcode-svg`**: Librería vital que genera al instante los códigos QR para que el operador los muestre en pantalla.
- **`expo-camera`**: Se usa para escanear los códigos QR desde los dispositivos móviles de los clientes y operadores.
- **`expo-print` & `expo-sharing`**: Combinación ganadora para compilar HTML en un archivo PDF corporativo y abrir el menú nativo del teléfono para enviarlo por WhatsApp o correo.
- **`@expo/vector-icons`**: Proveedor de toda la iconografía bonita de la aplicación (utilizando el paquete Ionicons principalmente).
- **`@react-native-async-storage/async-storage`**: Para guardar el "session token" y que la gente no tenga que iniciar sesión cada vez que abre la app.

---

## 💡 6. Datos adicionales

- **Arquitectura de UI/UX:** La app fue diseñada priorizando temas oscuros (`#0B132B`) combinados con acentos verde vibrante (`#00E676`) para darle una sensación moderna, limpia y "premium". 
- **Estandarización de Código:** Todo el código en `hooks/` y `components/` ha sido exhaustivamente comentado línea por línea con un estilo casual y advertencias claras de los problemas de borrar funciones. Si vas a agregar código nuevo, **asegúrate de mantener este estilo de documentación para no desentonar con el resto del proyecto**.
- **Manejo de Alertas:** En todo el proyecto se abandonaron las alertas nativas aburridas (`Alert.alert`). A partir de ahora, todo aviso se lanza utilizando el Singleton `AlertManager.show()`, el cual gatilla el componente visual `GlobalAlert.tsx`. ¡No uses la alerta por defecto de React Native!

¡Bienvenido al código fuente de QRuteishon! Disfruta explorando la ruta del futuro gasolinero. 🚀
