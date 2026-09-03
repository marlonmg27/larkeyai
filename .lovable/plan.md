# Persistir más campos en los endpoints puente de `whatsapp_connections`

Hoy los endpoints solo guardan `status`, `phone_number` y `chatwoot_inbox_id`; el resto
del payload se acepta pero se ignora. Vamos a persistir también (siempre de forma
opcional): `waba_id`, `phone_number_id`, `chatwoot_user_id`, `chatwoot_account_id` y
`waba_name`, porque tu backend a veces actualiza estos campos uno por uno.

## Cambios

### 1. `src/lib/whatsapp/connections.server.ts`

- **Esquema (`persistedShape`)**: agregar los cinco campos como opcionales/nullables:
  - `waba_id`: número entero coercible (la columna es `integer`).
  - `phone_number_id`: string (la columna es `varchar`).
  - `chatwoot_user_id`: número entero coercible.
  - `chatwoot_account_id`: número entero coercible.
  - `waba_name`: string trim, máx ~200.
  - Al ser `.nullish()` en todos, upsert y PATCH los aceptan sin obligarlos.
- **`pickPresent`**: incluir cada campo nuevo solo si viene en el request
  (omitir ≠ borrar, mismo patrón actual).
- **Tipos**: actualizar `PersistedFields` / `PatchFields` con los cinco campos opcionales.
- **Comentario de cabecera**: corregir la nota que dice que `phone_number_id` y
  `waba_id` se ignoran — ahora sí se persisten. `access_token` y `display_name`
  siguen ignorándose.

### 2. Sin cambios en la ruta ni en el contrato HTTP

Los endpoints (`upsert`, `status`, `by-phone`) quedan igual; simplemente aceptan y
guardan más campos. No requiere migración: las columnas ya existen en la tabla.

### 3. Documentación

Actualizar `src/lib/database/README.md` y `src/lib/whatsapp/README.md` con los campos
nuevos en los ejemplos de upsert/patch, aclarando que todos son opcionales.

## Verificación

Prueba real contra el preview: PATCH solo con `waba_id`, otro solo con `phone_number_id`,
y un upsert combinado, confirmando que los campos se guardan y que los omitidos no se
borran (la fila existente conserva sus valores).
