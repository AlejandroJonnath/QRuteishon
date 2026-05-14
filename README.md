# QRuteishon ⛽🚗

¡Bienvenido a **QRuteishon**! Esta es una aplicación móvil construida con React Native y Expo, diseñada para facilitar el pago de combustible mediante códigos QR y manejar la administración de gasolineras, operadores y clientes. 

Este documento explica cómo funciona el proyecto por dentro, cuál es su flujo principal y qué hace cada carpeta y archivo clave.

---

## 🌊 Flujo Principal del Proyecto

El flujo de la aplicación se basa en la **Autenticación Basada en Roles** (Role-Based Access Control). Cuando un usuario entra a la app:
1. **Inicio:** Se carga el `AuthContext` para verificar si hay una sesión activa guardada.
2. **Login:** Si no hay sesión, el usuario es dirigido a `app/login.tsx`.
3. **Redirección por Rol:** Al iniciar sesión, Supabase nos devuelve el perfil del usuario. Dependiendo de su campo `rol`, la aplicación lo envía a su área correspondiente:
   - 🧑‍💻 **Administrador:** Va a `/administrador` (gestiona usuarios, métricas, cupones).
   - 👷 **Operador:** Va a `/operador` (genera cobros QR, aprueba pagos, genera facturas).
   - 🚗 **Cliente:** Va a `/cliente` (ve su saldo, recarga billetera, escanea QR para pagar).

---

## 📂 ¿Qué hace cada sección (Estructura de Carpetas)?

La arquitectura de la aplicación separa claramente la vista (pantallas) de la lógica de negocio y los servicios de base de datos.

### 1. `app/` (Pantallas y Rutas)
Aquí vive **Expo Router**. Cada archivo en esta carpeta se convierte automáticamente en una pantalla o ruta de la app.
- **`_layout.tsx`**: Es el cascarón principal. Aquí envolvemos toda la app con el `AuthProvider` para que el contexto de sesión esté disponible en todas partes.
- **`index.tsx`**: Decide a qué pantalla mandar al usuario cuando abre la app (usando `useIndexLogic.ts`).
- **`login.tsx`**: Pantalla de inicio de sesión.
- **`administrador/`**: Pantallas exclusivas del admin (`clientes.tsx`, `operadores.tsx`, `analiticas.tsx`, `cupones.tsx`, etc.).
- **`operador/`**: Pantallas del operador de la gasolinera (`index.tsx` para escanear, `agregar-pago.tsx` para generar cobro, `factura.tsx` para facturar).
- **`cliente/`**: Pantallas del cliente final (`index.tsx` inicio, `recargar.tsx` recargar saldo, `pagar-qr.tsx` cámara para escanear).

### 2. `context/` (Estado Global)
- **`AuthContext.tsx`**: Es el cerebro de la sesión. Se conecta a Supabase, mantiene vivo el token del usuario y guarda en memoria su `perfil` (id, rol, estado) para que cualquier pantalla pueda saber "quién es el usuario actual".

### 3. `hooks/` (Lógica de Negocio)
En lugar de llenar las pantallas (`app/`) con miles de líneas de código, sacamos la lógica a **Custom Hooks**. Las pantallas solo dibujan la interfaz, y los hooks hacen el trabajo pesado.
- **`ClienteHooks/`**: Lógica de recargas, billetera y escaneo de pagos del cliente.
- **`OperadorHooks/`**: Lógica de generar pagos QR, validar cupones y emitir facturas.
- **`AdminHooks/`**: Lógica del CRUD (Crear, Leer, Actualizar, Borrar) de todos los usuarios y cupones.
- **`useRequireRole.ts`**: Un hook de seguridad vital. Si un cliente intenta entrar a la ruta `/administrador`, este hook lo patea de vuelta a su panel.

### 4. `services/` (Conexión con Supabase)
Son archivos puros de TypeScript que no saben nada de interfaces visuales; su único trabajo es hablar con la base de datos (Supabase).
- **`AuthService.ts`**: Iniciar sesión, cerrar sesión, obtener perfil.
- **`AdminService.ts`**: Usa un cliente secundario de Supabase para poder crear nuevos usuarios sin desloguear al administrador actual. También trae métricas.
- **`BilleteraService.ts`**: Consultas de saldo y creación de recargas.
- **`PagosService.ts`**: Creación de transacciones QR, cambio de estados (aprobado/rechazado) y emisión de facturas.
- **`CuponesService.ts`**: Verificación y canje de cupones de descuento.

### 5. `lib/` (Configuraciones base)
- **`supabase.ts`**: Inicializa la conexión con Supabase usando las variables de entorno (`.env`). Sin este archivo, nada se conecta a internet.

### 6. `components/` y `utils/`
- **`components/`**: Botones, tarjetas, modales o elementos visuales reutilizables que se repiten en varias pantallas.
- **`utils/`**: Funciones de ayuda (por ejemplo, formateadores de moneda, validadores de cédula, formateo de fechas).

---

## ⚡ ¿Qué partes son MÁS IMPORTANTES para que la app corra?

Si alguna de estas partes falla, la app entera se cae o no deja entrar a nadie:

1. **Variables de Entorno (`.env`) y `lib/supabase.ts`**: 
   Debes tener tus claves `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Si faltan, los `services/` no pueden hablar con la nube.

2. **`context/AuthContext.tsx`**: 
   Es la columna vertebral. El método `supabase.auth.onAuthStateChange` es el que "escucha" automáticamente si la sesión se venció o si el usuario cerró la app y volvió a entrar. Si este archivo tiene un bug, los usuarios verán una pantalla de carga infinita o serán expulsados al login.

3. **`app/_layout.tsx`**: 
   Si se te olvida envolver la app con `<AuthProvider>`, nadie tendrá acceso a la sesión y la app tronará de inmediato al intentar usar `useAuth()`.

4. **Reglas de Base de Datos (RLS en Supabase)**:
   Aunque está en la nube y no en este código, las Row Level Security policies de Supabase son vitales. Si no están bien configuradas, el cliente podría modificar saldos y el operador no podría aprobar pagos.
