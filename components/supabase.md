# Guía de Estudio — Políticas RLS en Supabase con PostgreSQL

## ¿Qué estás viendo aquí?

Este script configura seguridad avanzada usando:

- RLS (Row Level Security)
- funciones auxiliares
- políticas de acceso
- control por roles
- autenticación de Supabase

La idea principal es:

> Controlar exactamente qué puede ver o modificar cada usuario en cada tabla.

---

# Conceptos Importantes

## ¿Qué es RLS?

RLS significa:

> Row Level Security

Permite restringir acceso fila por fila.

Ejemplo:

| Usuario | Puede ver |
|---|---|
| Juan | Solo sus datos |
| Admin | Todos los datos |

Sin RLS:

```sql
SELECT * FROM perfiles;
```

mostraría TODO.

Con RLS:

cada usuario solo ve lo permitido.

---

# SECCIÓN 1 — FUNCIONES AUXILIARES

---

## Función: `auth_es_admin()`

```sql
CREATE OR REPLACE FUNCTION auth_es_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### `CREATE OR REPLACE FUNCTION`

```sql
CREATE OR REPLACE FUNCTION auth_es_admin()
```

Crea una función llamada:

```sql
auth_es_admin()
```

o la reemplaza si ya existe.

---

### `RETURNS boolean`

```sql
RETURNS boolean
```

La función devuelve:

- `true`
- `false`

---

### `AS $$`

```sql
AS $$
```

Aquí empieza el cuerpo SQL de la función.

---

### `SELECT EXISTS`

```sql
SELECT EXISTS (
```

`EXISTS` verifica si existe al menos una fila.

Devuelve:

- `true` → si encuentra algo
- `false` → si no encuentra nada

---

### Consulta interna

```sql
SELECT 1 FROM public.perfiles
WHERE id = auth.uid()
AND rol = 'admin'
```

Busca una fila donde:

| Condición | Significado |
|---|---|
| `id = auth.uid()` | usuario autenticado |
| `rol = 'admin'` | tiene rol admin |

---

### `auth.uid()`

```sql
auth.uid()
```

Función de Supabase que devuelve el ID del usuario autenticado.

---

### `SECURITY DEFINER`

```sql
SECURITY DEFINER
```

Hace que la función se ejecute con permisos del creador.

Permite consultar tablas protegidas aunque el usuario no tenga acceso directo.

---

## Función: `auth_es_staff()`

```sql
CREATE OR REPLACE FUNCTION auth_es_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('operador', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### ¿Qué hace?

Verifica si el usuario es:

- operador
- admin

---

### `IN`

```sql
rol IN ('operador', 'admin')
```

Equivale a:

```sql
rol = 'operador' OR rol = 'admin'
```

---

# SECCIÓN 2 — HABILITAR RLS

```sql
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
```

---

## ¿Qué hace?

Activa RLS en la tabla.

Desde ese momento:

> nadie puede acceder si no existe una POLICY.

---

## Tablas protegidas

Se activa en:

- perfiles
- billeteras
- cupones
- facturas
- gasolineras
- metodos_pago
- movimientos
- pagos_qr
- recargas

---

# SECCIÓN 3 — LIMPIEZA DE POLÍTICAS

```sql
DROP POLICY IF EXISTS ...
```

---

## ¿Qué hace?

Elimina políticas viejas si existen.

---

### `IF EXISTS`

Evita errores.

Sin eso:

si la policy no existe → PostgreSQL falla.

---

# SECCIÓN 4 — POLÍTICAS DE LA TABLA `PERFILES`

---

## Ver su propio perfil

```sql
CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON perfiles
FOR SELECT
USING (auth.uid() = id);
```

---

### `FOR SELECT`

Aplica solo a:

```sql
SELECT
```

---

### `USING`

```sql
USING (auth.uid() = id)
```

Permite acceder solo si:

```sql
auth.uid() = id
```

Ejemplo:

| auth.uid() | id fila | Resultado |
|---|---|---|
| 10 | 10 | permitido |
| 10 | 22 | denegado |

---

## Actualizar su propio perfil

```sql
FOR UPDATE USING (auth.uid() = id);
```

Solo puede modificar su propia fila.

---

## Admins pueden ver todo

```sql
USING ( auth_es_admin() )
```

Si la función devuelve `true`:

puede ver todas las filas.

---

## Insertar perfil

```sql
FOR INSERT WITH CHECK (true);
```

---

### `WITH CHECK`

Controla qué filas pueden insertarse.

---

### `(true)`

Permite cualquier inserción.

---

## ¿Por qué hacen esto?

Porque Supabase crea automáticamente perfiles al registrarse.

Si bloqueas INSERT:

el registro falla.

---

# SECCIÓN 5 — BILLETERAS

```sql
FOR ALL USING (usuario_id = auth.uid());
```

---

### `FOR ALL`

Aplica a:

- SELECT
- INSERT
- UPDATE
- DELETE

---

## ¿Qué hace?

Solo puedes operar tu propia billetera.

---

## Admins

```sql
USING ( auth_es_admin() )
```

Admins tienen acceso total.

---

# SECCIÓN 6 — MÉTODOS DE PAGO

Misma lógica:

```sql
usuario_id = auth.uid()
```

Cada usuario controla solo sus tarjetas o cuentas.

---

# SECCIÓN 7 — GASOLINERAS

---

## Todos pueden ver

```sql
FOR SELECT USING (auth.role() = 'authenticated');
```

---

### `auth.role()`

Devuelve el rol JWT actual.

Normalmente:

| Rol | Significado |
|---|---|
| authenticated | usuario logueado |
| anon | visitante |

---

## ¿Qué implica?

Cualquier usuario autenticado puede consultar gasolineras.

---

## Admins gestionan

```sql
FOR ALL USING ( auth_es_admin() );
```

Solo admins pueden:

- crear
- editar
- eliminar

---

# SECCIÓN 8 — CUPONES

---

## Cliente ve sus cupones

```sql
propietario_id = auth.uid()
```

Solo ve sus cupones.

---

## Staff gestiona

```sql
auth_es_staff()
```

Operadores y admins:

- crean
- modifican
- eliminan

---

# SECCIÓN 9 — FACTURAS

---

## Cliente ve sus facturas

```sql
cliente_id = auth.uid()
```

---

## Staff gestiona facturas

Operadores y admins pueden:

- generar facturas
- editarlas
- administrarlas

---

# SECCIÓN 10 — MOVIMIENTOS

```sql
usuario_id = auth.uid()
```

Cada usuario controla sus movimientos financieros.

---

# SECCIÓN 11 — PAGOS QR

---

## Todos los autenticados pueden leer

```sql
auth.role() = 'authenticated'
```

Esto permite:

- escanear QR
- validar QR
- consultar QR

---

## Cliente gestiona sus pagos

```sql
cliente_id = auth.uid()
```

---

## Staff también puede

```sql
auth_es_staff()
```

---

# SECCIÓN 12 — RECARGAS

---

## Usuario maneja sus recargas

```sql
usuario_id = auth.uid()
```

Puede:

- crear recargas
- consultar
- actualizar

---

## Staff administra

Operadores y admins tienen control completo.

---

# Diferencia importante entre `USING` y `WITH CHECK`

## `USING`

Controla:

> qué filas puedes VER o MODIFICAR

---

## `WITH CHECK`

Controla:

> qué filas puedes INSERTAR o DEJAR después de UPDATE

---

## Ejemplo

```sql
FOR INSERT
WITH CHECK (usuario_id = auth.uid())
```

Significa:

> solo puedes insertar filas con tu propio usuario_id.

---

# Resumen General de Arquitectura

Tu sistema tiene:

| Rol | Permisos |
|---|---|
| Cliente | solo sus datos |
| Operador | gestión operativa |
| Admin | acceso total |

---

# Ventajas del diseño

Esta implementación está bien estructurada porque:

- centraliza validaciones con funciones
- reutiliza lógica
- separa roles correctamente
- aplica mínimo privilegio
- usa RLS correctamente
- protege por fila
- evita acceso cruzado entre usuarios

---

# Posibles mejoras futuras

## Agregar `WITH CHECK`

En varios `FOR ALL` sería ideal.

Ejemplo:

```sql
FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid())
```

Porque `USING` solo controla acceso a filas existentes.

---

## Separar INSERT/UPDATE/DELETE

`FOR ALL` es cómodo pero menos granular.

En producción grande:

se suelen separar.

---

## Restringir más QR

Actualmente:

```sql
Todos los autenticados pueden leer los QR
```

Puede ser riesgoso dependiendo del negocio.

---

# Resumen Final

Este script implementa:

- autenticación segura
- autorización por roles
- seguridad fila por fila
- control total mediante RLS
- separación entre cliente/staff/admin
- protección de datos sensibles en Supabase/PostgreSQL