# Nuevos endpoints puente para el backend FastAPI

Mismo patrón que los endpoints actuales de `whatsapp_connections`: rutas bajo
`src/routes/api/public/...` (saltan el auth del sitio), autenticación con header
`X-Internal-Secret`, validación Zod y escritura/lectura con privilegios de servidor
importados dentro del handler.

## 1. `users` — actualizar IDs de Chatwoot

`PATCH /api/public/users/chatwoot`

```json
{ "user_id": "uuid", "chatwoot_user_id": 123, "chatwoot_account_id": 45 }
```

- Requerido: `user_id`. Al menos uno de los dos IDs debe venir presente.
- Solo se escriben los campos presentes (omitir ≠ borrar). Ninguna de estas dos
  columnas está en el trigger de columnas protegidas, así que la escritura pasa sin
  problema.
- `404 user_not_found` si el `user_id` no existe.
- Respuesta `200`: `{ "ok": true, "user_id": "…", "chatwoot_user_id": 123, "chatwoot_account_id": 45 }`

## 2. `messages` — saldo y consumo

Dos rutas, un solo módulo de lógica.

`POST /api/public/messages/can-send`

```json
{ "user_id": "uuid" }
```

Respuesta: `{ "ok": true, "user_id": "…", "can_send": true }` (RPC `can_send_message`).

`POST /api/public/messages/decrement`

```json
{ "user_id": "uuid", "count": 1 }
```

- `count` entero ≥ 1, default `1`, tope razonable para evitar errores del caller.
- Ejecuta la RPC `decrement_messages` y devuelve el saldo resultante leído de
  `usage_balance`: `{ "ok": true, "user_id": "…", "count": 1, "messages_remaining": 6999 }`.
- `404 usage_balance_not_found` si el usuario no tiene fila de saldo (así el backend
  distingue "sin balance" de "decrementado").

## 3. `whatsapp_connections` — unificar y buscar por teléfono

- Las URLs actuales **no cambian**: `POST /api/public/whatsapp/connections/upsert` y
  `PATCH /api/public/whatsapp/connections/status` siguen funcionando igual.
- Ambos handlers pasan a vivir en un solo archivo de ruta,
  `src/routes/api/public/whatsapp/connections.ts`, usando un splat para servir
  `/upsert`, `/status` y la nueva búsqueda, con el método HTTP validado por sub-ruta
  (`405` si no coincide, como hoy).
- Nuevo: `GET /api/public/whatsapp/connections/by-phone?phone_number=%2B526620000000`
  - Busca en `whatsapp_connections.phone_number` (match exacto y también normalizado
    a solo dígitos, para tolerar formato con espacios/guiones).
  - `200`: `{ "ok": true, "connection": { id, id_int, user_id, user_id_int, status, phone_number, chatwoot_inbox_id, chatwoot_account_id, chatwoot_user_id, waba_id, waba_name, updated_at } }`
  - `404 connection_not_found` si no hay fila.
  - Nunca devuelve credenciales (no se guardan en esta tabla).

## Errores (todos los endpoints)

| Código | Caso |
| --- | --- |
| 400 | `invalid_json` / `validation_error` |
| 401 | `unauthorized` (falta o no coincide `X-Internal-Secret`) |
| 404 | `user_not_found` / `usage_balance_not_found` / `connection_not_found` |
| 405 | método incorrecto |
| 500 | `database_error` (detalle solo en logs) |

## Detalles técnicos

- Nuevos módulos de lógica server-only:
  - `src/lib/users/chatwoot-ids.server.ts`
  - `src/lib/messages/usage.server.ts` (las dos funciones de messages en un módulo)
  - `src/lib/whatsapp/connections.server.ts` se amplía con `findConnectionByPhone`.
- Se reutilizan `verifyInternalSecret`, `parseBody` y `json` moviéndolos a un helper
  compartido `src/lib/api/internal.server.ts`, re-exportado desde
  `connections.server.ts` para no romper los imports existentes.
- Rutas nuevas: `src/routes/api/public/users/chatwoot.ts`,
  `src/routes/api/public/messages/can-send.ts`,
  `src/routes/api/public/messages/decrement.ts`, y
  `src/routes/api/public/whatsapp/connections.ts` (reemplaza `connections/upsert.ts`
  y `connections/status.ts`).
- Sin migraciones, sin cambios de esquema, sin cambios de UI.
- Documentación actualizada en `src/lib/database/README.md` con contratos y ejemplos
  `httpx`.

## Verificación

Llamadas reales a los endpoints (sin secreto → 401; con secreto y datos de prueba →
respuestas esperadas), y confirmación de que las URLs viejas de upsert/status siguen
respondiendo igual.
