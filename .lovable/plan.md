# Endpoints puente para `whatsapp_connections`

Dos endpoints HTTP en este proyecto que tu backend FastAPI puede llamar con un secreto
interno, sin manejar la service role key. La escritura real la hace este proyecto con
privilegios de servidor.

## Autenticación

Header obligatorio en ambos: `X-Internal-Secret: <BACKEND_INTERNAL_SECRET>`
(el mismo secreto ya provisionado que usa el reenvío hacia FastAPI). Comparación
timing-safe; sin él o con valor incorrecto → `401`.

## Base URL

- Producción: `https://larkeyai.lovable.app`
- Preview estable: `https://project--c2d08889-ea0a-462f-bee4-3d95a3ea2d73-dev.lovable.app`

## Endpoint 1 — upsert (equivale a `save_pending`)

`POST /api/public/whatsapp/connections/upsert`

Body aceptado (JSON):

```json
{
  "user_id": "uuid",
  "status": "pending",
  "phone_display": "+52 662 000 0000",
  "chatwoot_inbox_id": "12",
  "display_name": "Inmobiliaria X",
  "phone_number_id": "...",
  "waba_id": "...",
  "access_token": "..."
}
```

- Requeridos: `user_id` (uuid), `status` (`not_connected` | `pending` | `connected` | `error`).
- Opcionales: `phone_display`, `chatwoot_inbox_id`.
- `display_name`, `phone_number_id`, `waba_id`, `access_token` se aceptan para que tu
  payload actual no rompa, pero **se ignoran y nunca se guardan ni se loguean**. Las
  credenciales viven solo en tu backend.
- Upsert por `user_id` (índice único), así que llamarlo dos veces actualiza la misma fila.

Respuesta `200`:

```json
{ "ok": true, "user_id": "uuid", "status": "pending", "created": false }
```

## Endpoint 2 — patch de estado (equivale a `update_status`)

`PATCH /api/public/whatsapp/connections/status`

```json
{ "user_id": "uuid", "status": "connected", "phone_display": "+52 662 000 0000" }
```

- Requeridos: `user_id`, `status`. `phone_display` y `chatwoot_inbox_id` son opcionales y
  solo se escriben si vienen presentes (omitir ≠ borrar).
- Si no existe fila para ese `user_id` → `404 { "ok": false, "error": "connection_not_found" }`.

Respuesta `200`: `{ "ok": true, "user_id": "uuid", "status": "connected" }`

## Errores (ambos endpoints)

| Código | Caso |
| --- | --- |
| 400 | JSON inválido o validación (uuid mal formado, status fuera del enum) |
| 401 | Falta o no coincide `X-Internal-Secret` |
| 404 | Solo en patch: no hay fila para ese usuario |
| 405 | Método incorrecto |
| 500 | Error de base de datos (mensaje genérico, detalle solo en logs) |

Un `PATCH` a `connected` dispara el Realtime que ya escucha el dashboard, así que la card
del cliente se actualiza sola.

## Detalles técnicos

- Nuevos archivos de ruta: `src/routes/api/public/whatsapp/connections/upsert.ts` y
  `.../status.ts` (prefijo `api/public` para saltar el auth del sitio publicado).
- Lógica compartida en `src/lib/whatsapp/connections.server.ts`: verificación
  timing-safe del secreto, esquemas Zod y escritura con `supabaseAdmin` importado dentro
  del handler.
- El enum de `status` se reutiliza como contrato fijo (`src/lib/whatsapp/README.md`).
- Se documentan ambos endpoints con ejemplos `httpx` en `src/lib/database/README.md` y
  `src/lib/whatsapp/README.md`.
- Sin migraciones ni cambios de esquema; sin cambios de UI.

## Verificación

Llamada real a los endpoints publicados: sin secreto (espera 401), con secreto y
`user_id` inexistente (400/404), y upsert + patch sobre un usuario de prueba
confirmando la fila resultante.
