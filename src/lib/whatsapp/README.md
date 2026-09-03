# Onboarding del canal de mensajería

Flujo por el que un cliente con suscripción activa conecta su canal. La card primero muestra
un listado de canales disponibles (hoy solo **WhatsApp**) y, al elegir uno, despliega dos
caminos: la **conexión rápida** (Embedded Signup de Meta, hoy deshabilitada) y el formulario
manual.

## Embedded Signup de WhatsApp Business (DESACTIVADO)

Estructura completa, botón deshabilitado: la app de Meta todavía no está aprobada como
Tech Provider.

| Archivo | Rol |
| --- | --- |
| `src/lib/whatsapp/embedded-signup.ts` | Config del cliente: `appId` (`871512495342882`), `configId`, versión de Graph y flag `embeddedSignupEnabled` |
| `src/hooks/use-facebook-sdk.ts` | Carga idempotente y condicional de `https://connect.facebook.net/en_US/sdk.js` + `FB.init` |
| `src/components/dashboard/EmbeddedSignupButton.tsx` | Botón "Conectar WhatsApp Business" (disabled + tooltip "Próximamente"), `FB.login` y listener de `WA_EMBEDDED_SIGNUP` |
| `src/lib/whatsapp/embedded-signup.functions.ts` | `completeEmbeddedSignup` (server function con `requireSupabaseAuth`) |
| `src/lib/whatsapp/embedded-signup.server.ts` | `POST ${BACKEND_URL}/onboarding/whatsapp/embedded_signup` con `X-Internal-Secret` |

Payload al backend:

```json
{
  "channel": "whatsapp",
  "user_id": "<uuid del JWT verificado>",
  "code": "<response.authResponse.code>",
  "waba_id": null,
  "phone_number_id": null
}
```

Para activarlo cuando Meta apruebe la app:

1. Crear la configuración de Embedded Signup en el panel de Meta y copiar su ID.
2. `VITE_FB_WHATSAPP_CONFIG_ID=<config_id>` y `VITE_WHATSAPP_EMBEDDED_SIGNUP_ENABLED=true`
   (cliente) + `WHATSAPP_EMBEDDED_SIGNUP_ENABLED=true` (servidor, secreto).

Mientras los flags estén apagados: el SDK no se carga, el botón está `disabled` y la server
function devuelve `{ ok: false, reason: "disabled" }` sin contactar al backend. El `code`
nunca se loguea ni viaja directo del navegador al backend.


## Piezas

| Archivo | Rol |
| --- | --- |
| `src/lib/whatsapp/schema.ts` | Validación Zod compartida entre el formulario y el servidor + lista de canales (`messagingChannels`) |
| `src/lib/whatsapp.functions.ts` | `connectWhatsAppAccount`: server function con `requireSupabaseAuth` (el `user_id` sale del JWT verificado, nunca del body) |
| `src/lib/chatwoot/account.functions.ts` + `account.server.ts` | Paso 1: `POST ${BACKEND_URL}/onboarding` (`email`, `name`, `company_name`; la contraseña la define el backend). El backend escribe `users.chatwoot_user_id` y `users.chatwoot_account_id` |
| `src/lib/whatsapp/onboarding.server.ts` | Paso 2: `POST ${BACKEND_URL}/onboarding/connection` con `X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}`; incluye `chatwoot_user_id` y `chatwoot_account_id` |
| `src/components/dashboard/WhatsAppOnboardingCard.tsx` | Selector de canal + formulario y estados de carga/éxito/error y vista de "verificando" |
| `src/hooks/use-whatsapp-connection-realtime.ts` | Suscripción Realtime a la fila del usuario; invalida `["dashboard", userId]` |

## Payload enviado al backend

```json
{
  "channel": "whatsapp",
  "user_id": "<uuid del JWT verificado>",
  "waba_name": "Nombre de la cuenta de WhatsApp",
  "phone_number": "+526621234567",
  "phone_number_id": "123456789012345",
  "waba_id": "..."
}
```

`channel` se fija en el servidor a un valor de `messagingChannels`. El formulario ya **no**
pide ni reenvía `access_token`.

`phone_number` llega **siempre normalizado en E.164** (`+` + código de país + dígitos
nacionales, sin espacios ni separadores). El formulario tiene un selector de código de país
(`src/lib/phone/countries.ts`) y valida el largo de dígitos por país; el esquema compartido
además rechaza cualquier valor que no cumpla `^\+[1-9]\d{7,14}$`.

## Verificación con la Graph API (ACTIVA)

> Estado actual: el formulario pide el token ("Api Key") y la verificación con Meta se ejecuta
> **antes** de reenviar al backend (`verifyPhoneBelongsToWaba` en `src/lib/whatsapp.functions.ts`).
> Si falla, no se contacta al backend y el error se pinta en el campo correspondiente
> (`phoneNumberId` / `phoneNumber`) o como error general de la card.




`src/lib/whatsapp/graph.server.ts` (`verifyPhoneBelongsToWaba`) consulta la Graph API de Meta
**v25.0** con el secreto de servidor `WABA_ACCESS_TOKEN` (nunca se expone al cliente ni se
loguea):

1. `GET /v25.0/{waba_id}/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status`
   y busca el `phone_number_id` capturado.
2. Si esa llamada responde 400/403 (sin permisos sobre la cuenta), se usa el fallback
   `GET /v25.0/{phone_number_id}?fields=display_phone_number,verified_name`.
3. Compara solo dígitos entre `display_phone_number` y el `phone_number` E.164 del formulario.

Solo si la verificación pasa se hace el `POST` al backend. Si falla, la server function devuelve
`{ ok: false, verification: { field, message } }` y la card pinta el error en el campo:

| Caso | Campo | Mensaje |
| --- | --- | --- |
| ID inexistente en la cuenta | `phoneNumberId` | "Ese Phone number ID no existe en la WhatsApp Business Account indicada." |
| Número distinto al registrado | `phoneNumber` | "El número no coincide con el registrado en la WhatsApp Business Account (…)." |
| Red / token / error de Meta | — | "No pudimos validar el número con WhatsApp en este momento. Inténtalo de nuevo." |

El frontend **nunca escribe** en `public.whatsapp_connections`: el usuario solo tiene `SELECT`
de su propia fila. El backend de FastAPI (service role) es el único dueño de la escritura.


## Contrato fijo de `status`

La columna `status` usa el enum `whatsapp_connection_status`, con exactamente estos valores:

| Valor | Significado | UI |
| --- | --- | --- |
| `not_connected` | Sin conexión iniciada | Muestra el formulario |
| `pending` | Credenciales recibidas, verificación en curso | Muestra "Estamos verificando tu conexión…" + botón "Actualizar estado" |
| `connected` | Conexión activa | La card de onboarding desaparece |
| `error` | Falló la verificación | Muestra el formulario con aviso de error |

**Este es un contrato fijo que el backend de FastAPI debe respetar.** La UI tiene lógica
condicional construida sobre esos valores exactos: escribir `failed`, `verifying`, `ok` u
otro valor rompe la card silenciosamente (además de que el enum de Postgres rechazará el
`UPDATE`).

Si se necesita un estado nuevo, el orden es:

1. Agregar el valor al enum `whatsapp_connection_status` con una migración en este proyecto.
2. Actualizar la UI (card + dashboard) para manejarlo.
3. Solo entonces el backend empieza a escribirlo.

Nunca al revés.

## Realtime

`public.whatsapp_connections` está en la publicación `supabase_realtime` con
`REPLICA IDENTITY FULL`. El canal se abre con el cliente Supabase autenticado del frontend,
por lo que RLS limita los eventos a la fila del propio usuario. Como respaldo para redes que
bloquean WebSockets, la card ofrece un botón "Actualizar estado" mientras el status es
`pending`.

## Endpoints puente que escribe el backend

El backend FastAPI puede escribir y leer la fila sin service role key, vía tres endpoints
de este proyecto (`X-Internal-Secret: {BACKEND_INTERNAL_SECRET}`), todos servidos por un
único archivo de ruta `src/routes/api/public/whatsapp/connections/$.ts`:

| Endpoint | Equivalente en el backend |
| --- | --- |
| `POST /api/public/whatsapp/connections/upsert` | `save_pending` |
| `PATCH /api/public/whatsapp/connections/status` | `update_status` |
| `GET /api/public/whatsapp/connections/by-phone?phone_number=…` | buscar por teléfono |

Lógica compartida en `src/lib/whatsapp/connections.server.ts` (helpers de autenticación y
validación en `src/lib/api/internal.server.ts`). Los dos de escritura son idempotentes
(upsert por `user_id`): el `PATCH` crea la fila si no existe y devuelve `created`, así que
no responde `connection_not_found`. En el `PATCH` el único campo requerido es `user_id`:
todos los demás campos persistibles son opcionales y solo se escriben si vienen
presentes (si hay que crear la fila sin `status`, se usa `pending`). En el `POST` de upsert
`status` sí es obligatorio. Solo persisten `user_id`, `status`, `phone_number` y
`chatwoot_inbox_id`, `waba_id`, `phone_number_id`, `chatwoot_user_id`, `chatwoot_account_id` y `waba_name`; las credenciales que vengan en el body (`display_name`,
`access_token`) se aceptan pero se ignoran y nunca se
loguean. El `GET` busca por `phone_number` (match exacto y también comparando solo
dígitos) y devuelve la fila completa o `404 connection_not_found`. Contratos completos en
`src/lib/database/README.md`.


## Api Key (access token) y guía de Chatwoot

- El formulario pide de nuevo el token, etiquetado **"Api Key"** solo en la UI. Internamente
  es `accessToken` (schema.ts) y se reenvía al backend como `access_token`. Si viniera vacío,
  `onboarding.server.ts` usa `WABA_ACCESS_TOKEN` como respaldo. Nunca se registra en logs.
- La verificación con Graph API está activa y usa ese token (o `WABA_ACCESS_TOKEN` de respaldo).
- Tras un envío exitoso, la card muestra `ChatwootSetupGuide`: credenciales por defecto
  (email del usuario + `Default123!`), botón a `${CHATWOOT_FRONTEND_URL}/app/login`
  (`src/lib/chatwoot.ts`, sobrescribible con `VITE_CHATWOOT_FRONTEND_URL`) y la guía para
  crear el inbox manualmente (Settings → Inboxes → Add Inbox → WhatsApp).
