# Conectores por usuario (App User Connectors)

Cada usuario de Larkey conecta su propia cuenta del proveedor (hoy Google
Calendar) mediante el gateway de Lovable. El sitio nunca implementa OAuth a
mano ni guarda tokens del proveedor: solo maneja la **llave de conexión**
(`lovack_*`) que el gateway emite por usuario.

## Dónde se guarda la llave

En el backend de Python (FastAPI). La tabla `public.app_user_connections` de
esta base de datos quedó sin uso (no se borra).

El sitio llama al backend con `X-Internal-Secret: <BACKEND_INTERNAL_SECRET>`
sobre `BACKEND_URL`, igual que los puentes de WhatsApp. Cliente HTTP:
`src/server/backendConnections.server.ts` (timeout 15 s, errores en español,
nunca registra la llave). Capa de dominio: `src/server/appUserConnections.server.ts`.

Tabla sugerida en el backend:

```sql
app_user_connections(
  user_id uuid,
  connector_id text,
  connection_key text,
  connection_key_ciphertext text,
  created_at timestamptz,
  updated_at timestamptz,
  unique (user_id, connector_id)
)
```

## Contratos

Todos requieren `X-Internal-Secret` y responden `401` si falta o no coincide.

### `PUT /connectors/connections`

Upsert por `(user_id, connector_id)`; actualiza `updated_at`.

```json
{
  "user_id": "4d37caff-62a0-4672-885f-95836baadce6",
  "connector_id": "google_calendar",
  "connection_key": "lovack_...",
  "connection_key_ciphertext": "base64(iv|tag|ciphertext)"
}
```

- `connection_key`: la llave en claro.
- `connection_key_ciphertext`: la misma llave cifrada por Larkey con
  AES-256-GCM (`APP_USER_CONNECTION_KEY_SECRET`, base64 de `iv|tag|ciphertext`).

Respuesta `200`: `{ "ok": true }`

### `GET /connectors/connections/{user_id}/{connector_id}`

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

- Si no existe: `{ "ok": true, "connection": null }` (también vale `404`).
- Debe venir al menos una de las dos formas de la llave. El sitio prefiere
  `connection_key`; si no viene, descifra `connection_key_ciphertext`.

### `DELETE /connectors/connections/{user_id}/{connector_id}`

Respuesta `200`: `{ "ok": true }`. Idempotente: también `200` si no existía.

### Errores

```json
{ "ok": false, "error": "validation_error" | "not_found" | "internal_error", "detail": "texto opcional" }
```

El sitio muestra `detail` (o `message` / `error`) al usuario cuando existe.

## Flujo de conexión (sin cambios para el usuario)

1. `startGoogleCalendarConnect` pide la URL de consentimiento al gateway. Si ya
   hay llave guardada, la manda para que el gateway reconozca la reconexión.
2. Ventana emergente → Google → `/oauth/google-calendar/return` envía el código
   de un solo uso a la ventana que la abrió.
3. `completeGoogleCalendarConnection` intercambia el código por la llave y hace
   `PUT /connectors/connections`.
4. Eventos y evento de prueba: el sitio lee la llave con `GET`, y llama a Google
   a través del gateway (`callAsAppUser`).
5. Desconectar: avisa al gateway y luego hace `DELETE`.

## Notas

- La URI de redirección autorizada en Google debe ser exactamente
  `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`.
- La llave nunca llega al navegador; todas las llamadas al proveedor ocurren en
  server functions.
