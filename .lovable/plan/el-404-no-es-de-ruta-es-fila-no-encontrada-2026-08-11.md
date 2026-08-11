# El 404 no es de ruta: es "fila no encontrada"

## Diagnóstico (verificado)

- Los dos endpoints publicados existen y responden: llamados sin el header devuelven
  `401 {"ok":false,"error":"unauthorized"}`, así que la ruta está bien desplegada.
- La tabla `whatsapp_connections` está **vacía** (0 filas).
- El usuario `4d37caff-…` sí existe en `users` (marlonmolinag@hotmail.com), pero no tiene
  fila de conexión.

Por diseño, el PATCH solo actualiza y responde
`404 {"ok":false,"error":"connection_not_found"}` cuando no hay fila. Eso es exactamente
lo que estás recibiendo (el cuerpo de la respuesta lo confirma).

## Qué cambiar

Hacer que el PATCH de estado sea idempotente: si no existe fila para ese `user_id`, la crea
en lugar de fallar. Así tu backend puede llamar solo a `status` sin depender de un
`upsert` previo.

- `PATCH /api/public/whatsapp/connections/status` pasa a comportarse como upsert por
  `user_id`: actualiza si existe, inserta si no.
- La respuesta agrega `created: true|false` para que puedas distinguir el caso.
- Se conserva el resto del contrato: mismos campos, `phone_display` y `chatwoot_inbox_id`
  solo se escriben si vienen presentes, mismos códigos 400/401/500.
- `connection_not_found` deja de ocurrir en este endpoint (se documenta el cambio).
- El endpoint `upsert` se mantiene igual, sin cambios.

## Detalles técnicos

- `src/lib/whatsapp/connections.server.ts`: `patchConnectionStatus` reutiliza la misma
  escritura con `supabaseAdmin.upsert(..., { onConflict: "user_id" })` que ya usa
  `upsertConnection`, devolviendo `created`.
- `src/routes/api/public/whatsapp/connections/status.ts` no cambia.
- Se actualizan las tablas de errores y ejemplos en `src/lib/database/README.md` y
  `src/lib/whatsapp/README.md`.
- Sin migraciones ni cambios de UI. El Realtime del dashboard sigue disparándose igual.

## Verificación

Llamada real al endpoint publicado con el secreto y el `user_id` `4d37caff-…`:
esperar `200 { ok: true, status: "connected", created: true }` y confirmar la fila
resultante en la base de datos.
