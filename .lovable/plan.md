# Por qué el PATCH devolvió 400 (y cómo arreglarlo)

## Causa confirmada

La respuesta lo dice exactamente:

```json
{"ok":false,"error":"validation_error","issues":[{"path":["status"],"message":"Required"}]}
```

Tu backend envió solo `user_id` y `chatwoot_inbox_id`. Pero en
`src/lib/whatsapp/connections.server.ts` el schema del PATCH (`patchConnectionSchema`)
declara `status` como campo **obligatorio**, igual que el de upsert: ambos comparten
el mismo `persistedShape`. Al faltar `status`, Zod falla y el helper de
`src/lib/api/internal.server.ts` devuelve 400 antes de tocar la base de datos.

No es un problema de secreto, de ruta ni de base de datos: la ruta y la
autenticación funcionaron; el cuerpo no pasó la validación.

## Arreglo propuesto

Hacer que el PATCH sea un update parcial de verdad (que es lo que su nombre implica),
sin cambiar el upsert:

1. `patchConnectionSchema`: `status` pasa a ser opcional. `user_id` sigue obligatorio.
   `upsertConnectionSchema` no cambia (ahí `status` sigue siendo requerido).
2. Separar la lógica: `patchConnectionStatus` deja de reenviar a `upsertConnection`.
   - Si la fila existe: hace `update` solo con los campos presentes (`status`,
     `phone_number`, `chatwoot_inbox_id`). Omitir un campo no lo borra.
   - Si la fila no existe y no vino `status`: la crea con `status: "pending"`
     (mismo comportamiento idempotente actual, sin inventar un estado falso de
     "connected").
   - Respuesta `200`: `{ ok: true, user_id, status, created }` con el `status`
     resultante leído de la fila, para que el backend sepa en qué estado quedó.
3. Actualizar el contrato en `src/lib/database/README.md` y
   `src/lib/whatsapp/README.md`: en `PATCH .../status`, `status` es opcional; el
   único campo requerido es `user_id`.

## Alternativa (si prefieres no tocar el frontend)

Que tu FastAPI incluya siempre `status` en el body del PATCH. Es un cambio de una
línea de tu lado, pero deja el endpoint incapaz de actualizar solo el
`chatwoot_inbox_id`, que es justo lo que intentabas hacer.

## Alcance técnico

Sin migraciones, sin cambios de esquema de base de datos, sin cambios de UI. Solo
`src/lib/whatsapp/connections.server.ts` y los dos README. Verificación: repetir tu
mismo request (`user_id` + `chatwoot_inbox_id`, sin `status`) y confirmar 200, más un
request sin secreto para confirmar que sigue dando 401.
