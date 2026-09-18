# Mover las conexiones de conectores al backend

Hoy la llave de conexión de cada usuario (Google Calendar) se guarda en la tabla `app_user_connections` de esta base de datos. La movemos a la base de datos de tu backend: Larkey dejará de leer/escribir esa tabla y, en su lugar, llamará a tu API con el mismo esquema de seguridad que ya usamos para WhatsApp (`X-Internal-Secret`). La tabla actual queda en su sitio, sin uso ni borrado.

El flujo de conexión con Google (la ventana emergente, el intercambio del código de un solo uso, ver eventos, crear evento de prueba, desconectar) sigue funcionando igual para el usuario.

## Contratos que debes crear en tu backend (FastAPI)

Base: `{BACKEND_URL}`. Todos requieren la cabecera `X-Internal-Secret: <BACKEND_INTERNAL_SECRET>` y responden `401` si falta o no coincide.

Tabla sugerida en tu backend: `app_user_connections(user_id uuid, connector_id text, connection_key text, connection_key_ciphertext text, created_at, updated_at)` con índice único `(user_id, connector_id)`.

### 1. `PUT /connectors/connections`
Guarda (upsert) la conexión de un usuario para un conector.

Request:
```json
{
  "user_id": "4d37caff-62a0-4672-885f-95836baadce6",
  "connector_id": "google_calendar",
  "connection_key": "lovack_...",
  "connection_key_ciphertext": "base64(iv|tag|ciphertext)"
}
```
- `connection_key`: la llave en claro (para que después decidas si el cifrado se queda en tu backend).
- `connection_key_ciphertext`: la misma llave cifrada con AES-256-GCM por Larkey (útil si prefieres que Larkey siga siendo el único que la descifra).
- Upsert por `(user_id, connector_id)`; actualiza `updated_at`.

Response `200`: `{ "ok": true }`

### 2. `GET /connectors/connections/{user_id}/{connector_id}`
Devuelve la conexión guardada. Lo usa Larkey antes de cada llamada a Google.

Response `200` (existe):
```json
{
  "ok": true,
  "connection": {
    "user_id": "…",
    "connector_id": "google_calendar",
    "connection_key": "lovack_...",
    "connection_key_ciphertext": "base64…",
    "updated_at": "2026-09-18T22:00:00Z"
  }
}
```
Response `200` (no existe): `{ "ok": true, "connection": null }`

Regla: al menos uno de los dos campos de llave debe venir. Si solo mandas `connection_key_ciphertext`, Larkey lo descifra; si mandas `connection_key`, lo usa tal cual.

### 3. `DELETE /connectors/connections/{user_id}/{connector_id}`
Borra la conexión. Larkey lo llama al desconectar, después de avisar al gateway de Lovable.

Response `200`: `{ "ok": true }` (también `200` si no existía, para que desconectar sea idempotente).

### Errores
Formato común para que Larkey muestre un mensaje claro:
```json
{ "ok": false, "error": "validation_error" | "not_found" | "internal_error", "detail": "texto opcional" }
```

## Cambios en este sitio

- `src/server/appUserConnections.server.ts`: deja de usar Supabase y pasa a llamar los tres endpoints anteriores (`save`, `get`, `delete`), manteniendo la misma firma que ya consume Google Calendar.
- Nuevo `src/server/backendConnections.server.ts`: cliente HTTP con `BACKEND_URL` + `X-Internal-Secret`, tiempo límite de 15 s y errores en español.
- `saveConnectionKeyForUser` envía la llave en claro y la cifrada; `getConnectionKeyForUser` prefiere la llave en claro y, si no viene, descifra la cifrada con `connectionKeyCrypto.ts`.
- `src/lib/connectors/google-calendar.server.ts` y las server functions no cambian de firma; siguen funcionando igual.
- `public.app_user_connections` se queda tal cual, sin lecturas ni escrituras desde el sitio.
- Documentación en `src/lib/connectors/README.md` con estos contratos.

## Nota

Mientras tu backend no tenga los endpoints arriba, conectar Google Calendar fallará con un mensaje claro ("no pudimos guardar tu conexión"). Si prefieres, puedo dejar un respaldo temporal a la tabla actual cuando el backend no responda — dímelo y lo agrego.
