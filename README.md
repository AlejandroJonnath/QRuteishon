# Proyecto QRuta - Documentación Técnica y Arquitectura

## Estructura de Carpetas y Archivos

### Carpeta `app/`
**¿Qué es?** El directorio principal de rutas usando Expo Router.
**¿Para qué sirve?** Define todas las pantallas y la navegación de la aplicación basándose en la estructura de archivos y carpetas.
**¿Cómo funciona?** Cada archivo `.tsx` se convierte automáticamente en una ruta de la aplicación. Las subcarpetas como `administrador/`, `cliente/` y `operador/` actúan como grupos de rutas protegidas para cada tipo de usuario.
**¿Por qué lo hice así?** Porque utilizar Expo Router (File-based routing) simplifica enormemente la navegación en React Native. Elimina la necesidad de crear y mantener archivos de configuración gigantescos y engorrosos de navegación manual.
**Ventajas:** Permite tener un código mucho más limpio, facilita el *deep linking* automático (enlaces profundos hacia pantallas específicas) y otorga una separación visual clara de los módulos en el código.

####  `app/_layout.tsx`
**¿Qué es?** El "cascarón" o layout maestro de toda la aplicación.
**¿Para qué sirve?** Envuelve a toda la app en los proveedores globales (como `AuthContext`) e inicializa el sistema de alertas.
**¿Cómo funciona?** Retorna el componente `<Stack>` de Expo Router, pero envuelto en el `<AuthProvider>` y acompañado del `<GlobalAlert />`.
**¿Por qué lo hice así?** Para asegurar que el contexto de autenticación y las alertas estén disponibles en absolutamente todas las pantallas desde el milisegundo cero en que se abre la app.
**Ventajas:** La sesión del usuario y la capacidad de mostrar errores persisten fluidamente sin importar a qué pantalla viaje el usuario.

####  `app/index.tsx`
**¿Qué es?** El punto de entrada inicial y la pantalla de carga "invisible".
**¿Para qué sirve?** Actúa como un policía de tránsito direccional cuando el usuario abre la aplicación.
**¿Cómo funciona?** Simplemente renderiza un ícono de carga, pero por detrás llama al hook `useIndexLogic()`, evalúa el rol del usuario, y lo expulsa automáticamente a `/login` o lo deja pasar a su panel respectivo.
**¿Por qué lo hice así?** Para evitar que el usuario tenga que elegir su rol manualmente o que vea pantallas parpadeando entre transiciones de logueo.
**Ventajas:** Provee una experiencia de usuario extremadamente fluida y profesional (seamless login flow).

####  `app/login.tsx`
**¿Qué es?** La pantalla maestra de autenticación.
**¿Para qué sirve?** Permite al usuario iniciar sesión, registrar una cuenta nueva o recuperar su contraseña.
**¿Cómo funciona?** En lugar de navegar a 3 páginas distintas, usa un contenedor animado con la librería `react-native-reanimated` que intercambia entre los componentes `LoginForm`, `RegisterForm` y `ForgotPasswordForm` basándose en un simple estado local.
**¿Por qué lo hice así?** Para que la interfaz se sienta interactiva, rápida y moderna, siguiendo las tendencias de diseño de aplicaciones premium.
**Ventajas:** Cero tiempos de carga al cambiar entre vistas de autenticación, animaciones de transición elásticas suaves, y no ensucia el historial de navegación.

### carpeta `components/`
**¿Qué es?** La biblioteca de bloques visuales reutilizables.
**¿Para qué sirve?** Aloja las piezas de interfaz que se repiten en múltiples pantallas (botones, modales, formularios específicos).
**¿Cómo funciona?** Son funciones de React que reciben parámetros (props) y simplemente se dibujan en pantalla. No manejan lógica pesada de base de datos por sí mismos.
**¿Por qué lo hice así?** Para mantener el principio de Separación de Responsabilidades: lo visual por un lado, y los "cerebros" por el otro.
**Ventajas:** Permite a los desarrolladores cambiar el diseño visual sin riesgo de romper la lógica de transacciones, y viceversa.

#### `components/GlobalAlert.tsx`
**¿Qué es?** El modal maestro de notificaciones personalizadas.
**¿Para qué sirve?** Reemplaza las horribles alertas nativas del sistema operativo por modales estilizados y coherentes con la paleta de colores de QRuteishon.
**¿Cómo funciona?** Se monta una sola vez en el `_layout.tsx`, escucha a la clase Singleton `CustomAlert` y aparece superponiéndose oscureciendo el fondo de cualquier pantalla activa.
**¿Por qué lo hice así?** Porque tener que importar e instanciar un `<Modal>` distinto en cada una de las 30 pantallas del proyecto hubiera sido una pesadilla de mantenimiento.
**Ventajas:** Consistencia total en la identidad visual de la marca y uso extremadamente centralizado mediante una sola línea de código en cualquier parte.

### carpeta `context/`
**¿Qué es?** El almacén del estado global (AuthContext).
**¿Para qué sirve?** Mantener la sesión de Supabase viva y disponible globalmente sin tener que pasar los datos de pantalla en pantalla.
**¿Cómo funciona?** Usa la API de Contexto de React y se suscribe en tiempo real al evento `onAuthStateChange` de Supabase.
**¿Por qué lo hice así?** Es el estándar en la industria de React para manejar datos vitales de los que dependen múltiples módulos aislados.
**Ventajas:** Evita el "prop drilling" (pasar variables manualmente por 10 capas de componentes).

### carpeta `hooks/`
**¿Qué es?** Los "Cerebros" separados de cada pantalla (Lógica de Negocio).
**¿Para qué sirve?** Extraer toda la carga mental (estados locales, llamadas a APIs, validaciones de formularios) fuera de los archivos visuales (UI).
**¿Cómo funciona?** Son Custom Hooks (funciones que inician con `use...`) que procesan los datos y devuelven variables y métodos listos para que la vista solo los "conecte" a los botones.
**¿Por qué lo hice así?** Para evitar tener archivos de 1000 líneas mezclando etiquetas `<View>` con validaciones SQL.
**Ventajas:** El código visual queda inmaculadamente limpio y la lógica se puede testear de forma completamente independiente.

### carpeta `services/`
**¿Qué es?** La capa de infraestructura o de comunicación con Supabase.
**¿Para qué sirve?** Centraliza de manera absoluta todas las consultas SQL, inserciones, actualizaciones y llamadas de red.
**¿Cómo funciona?** Son objetos simples (`AuthService`, `PagosService`, etc.) que agrupan métodos asíncronos para hablar con el cliente de base de datos.
**¿Por qué lo hice así?** En caso de que algún día QRuteishon deje Supabase y pase a usar Firebase o un backend en Node.js, solo se toca esta carpeta y NINGÚN otro archivo del proyecto se entera del cambio.
**Ventajas:** Máxima seguridad y escabilidad arquitectónica.

### carpeta `utils/`
**¿Qué es?** La caja de herramientas genéricas.
**¿Para qué sirve?** Alojar funciones puras matemáticas o de texto: formateadores de moneda, generadores de PDF, validadores regex de correos, etc.
**¿Cómo funciona?** Simples funciones exportadas sin estado propio.
**¿Por qué lo hice así?** Para evitar duplicar el código de validación de correo o formateo de fechas 5 veces en 5 pantallas distintas.
**Ventajas:** Código estandarizado, DRY (Don't Repeat Yourself).

---

## Mejoras de Seguridad implementadas para Auditoría OWASP (Nivel 2)

Durante el desarrollo, realicé intervenciones profundas para garantizar que Q-Ruta cumpla con los estándares rigurosos de OWASP Nivel 2. 

**1. Prevención de Mass Assignment e Inyecciones de Base de datos (OWASP M7/M4)**
- **Plan Estratégico:** Un atacante astuto podría enviar datos no solicitados (ej. inyectar `{ rol: 'admin' }` al registrarse) o manipular parámetros de precio al crear pagos QR enviando campos malformados mediante interceptación de peticiones.
- **Dónde lo apliqué:** En toda la carpeta `services/` (específicamente en `PagosService.ts` y `AuthService.ts`).
- **Implementación:** Integré **Validación Universal y Estricta con Zod**. Se crearon esquemas como `CrearPagoSchema.strict()`. El comando `.strict()` garantiza que si el atacante envía un solo campo no reconocido, o tipos de datos incorrectos (letras en vez de números para el precio), la capa de servicio rechaza la petición instantáneamente en el cliente antes siquiera de tocar la base de datos.

**2. Control de Acceso y Autorización a Nivel de Fila (RLS)**
- **Plan Estratégico:** Asegurar que si el token del cliente A es robado, el atacante de todas formas no pueda leer las facturas ni la billetera del cliente B, ni acceder a funciones de Operador.
- **Dónde lo apliqué:** Se configuraron políticas encriptadas a nivel de la misma base de datos en Supabase (reflejado en las guías documentadas del proyecto) para forzar que el `auth.uid()` siempre coincida con el propietario del registro.

**3. Protección contra Ingeniería Inversa y Descompilación (Ofuscación)**
- **Plan Estratégico:** Como QRuteishon maneja dinero (Billeteras Virtuales, Cupones, Pagos), el código fuente es un blanco crítico. Un atacante no debe poder abrir el archivo APK y leer nuestra lógica en texto claro.
- **Dónde lo apliqué:** A través de la configuración de ProGuard activada en los perfiles de construcción de Expo/Android, asegurando que las clases, métodos sensibles y tokens se ofusquen en binario ilegible en producción.

**4. Prevención de Capturas de Pantalla (Screen Capture Protection)**
- **Plan Estratégico:** Evitar robo de fondos o fuga de datos a través de capturas en segundo plano causadas por malwares instalados en el celular del usuario, o clonación de códigos QR de pago.
- **Dónde lo apliqué:** Se configuraron bloqueos a nivel de las vistas financieras usando los paquetes nativos de la plataforma, forzando pantallas negras cuando la app pasa a segundo plano o cuando el sistema intenta grabar la pantalla.

**5. Prevención de Condiciones de Carrera (Race Conditions) y "Sesiones Zombi"**
- **Plan Estratégico:** Cuando un usuario loguea, hay un lapso de milisegundos donde existe una "sesión" pero el "perfil de rol" aún no ha cargado. Esto causaba fallas críticas de seguridad donde un usuario inactivo o con rol indefinido podía navegar por la app.
- **Dónde lo apliqué:** En `context/AuthContext.tsx`.
- **Implementación:** Intervine el evento `onAuthStateChange` forzando de forma imperativa un bloqueo estricto (`setLoading(true)`) que congela cualquier intento de redirección hasta que Supabase garantice que ha descargado el perfil completo del usuario y confirmado que el estado es "activo".

---

## Análisis de Impacto Crítico (Qué pasa si borras archivos)

### 1. `app/index.tsx`
- **¿En qué afecta?** La aplicación fallará estrepitosamente apenas se abra. Al ser el archivo raíz `/`, Expo Router no encontrará el punto de entrada y la pantalla quedará en blanco o arrojará un "Unmatched Route".
- **¿Cómo solucionarlo?** Restaura el archivo, el cual tiene una estructura obligatoria sumamente corta.
- **¿Qué tengo que buscar si cambian algo?** Lo fundamental es que este archivo llame siempre al hook `useIndexLogic()`. Si alguien modifica este archivo y pone un diseño o botones manuales allí, cometerá un error de UX gravísimo, ya que este archivo no está diseñado para que el usuario interactúe con él.

### 2. `context/AuthContext.tsx`
- **¿En qué afecta?** Colapso total del sistema. Absolutamente todas las rutas protegidas, todos los hooks, y el layout principal dependen del `useAuth()`. Toda la app lanzará un pantallazo rojo de error fatal.
- **¿Cómo solucionarlo?** Restáuralo asegurándote de exportar tanto el `AuthProvider` como el hook `useAuth()`, y asegúrate de volver a envolver la aplicación en `_layout.tsx`.
- **¿Qué tengo que buscar si cambian algo?** Vigila de cerca las líneas donde se activa y desactiva el `loading`. Si alguien quita el `setLoading(true)` al inicio del cambio de estado de sesión, reintroducirán el bug fatal del parpadeo, devolviendo a los usuarios legítimos al Login por culpa del "Race Condition".

### 3. `services/PagosService.ts`
- **¿En qué afecta?** El negocio se paraliza por completo. Los operadores presionarán el botón de crear QR y nada sucederá; los clientes escanearán códigos QR pero la app será incapaz de leerlos, validarlos o descontar saldos. El muro de seguridad Zod desaparecerá y los endpoints quedarán vulnerables.
- **¿Cómo solucionarlo?** Restáuralo desde el control de versiones. Es el archivo más complejo en cuanto a flujos (maneja 4 pasos atómicos en transacciones de dinero).
- **¿Qué tengo que buscar si cambian algo?** Revisa de forma maníaca y microscópica los **Esquemas Zod (`CrearPagoSchema`)**. Si un desarrollador agrega una columna a la base de datos de Supabase, o modifica los "tipos de gasolina" (por ejemplo, cambia "Extra" por "extra" en minúsculas), pero NO actualiza el esquema Zod de este archivo... la app rechazará silenciosamente cualquier pago con un error 400 que volverá locos a todos.

### 4. `utils/AlertManager.ts` (y `GlobalAlert.tsx`)
- **¿En qué afecta?** La aplicación perderá la capacidad de "hablarle" al usuario. Si falla una tarjeta, si el QR expira, o si el usuario no tiene saldo, el error se quedará escondido en la consola invisible. El usuario pensará que los botones no funcionan porque los modales de advertencia dejarán de existir.
- **¿Cómo solucionarlo?** Restaura el `AlertManager.ts` y asegúrate de volver a insertar el `<GlobalAlert />` al final del archivo `_layout.tsx`.
- **¿Qué tengo que buscar si cambian algo?** En `AlertManager.ts`, revisa que nadie borre la instancia Singleton final: `export const CustomAlert = new AlertManager()`. Si un programador no experimentado cambia eso y exporta la Clase genérica, toda la app perderá el canal de comunicación y los modales jamás volverán a abrirse.
