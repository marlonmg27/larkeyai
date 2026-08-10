# Onboarding del canal de mensajería

Flujo por el que un cliente con suscripción activa conecta su canal. La card primero muestra
un listado de canales disponibles (hoy solo **WhatsApp**) y, al elegir uno, despliega el
formulario correspondiente.

## Piezas

| Archivo | Rol |
| --- | --- |
| `src/lib/whatsapp/schema.ts` | Validación Zod compartida entre el formulario y el servidor + lista de canales (`messagingChannels`) |
| `src/lib/whatsapp.functions.ts` | `connectWhatsAppAccount`: server function con `requireSupabaseAuth` (el `user_id` sale del JWT verificado, nunca del body) |
| `src/lib/whatsapp/onboarding.server.ts` | `POST ${BACKEND_URL}/onboarding/whatsapp` con `X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}` |
| `src/components/dashboard/WhatsAppOnboardingCard.tsx` | Selector de canal + formulario y estados de carga/éxito/error y vista de "verificando" |
| `src/hooks/use-whatsapp-connection-realtime.ts` | Suscripción Realtime a la fila del usuario; invalida `["dashboard", userId]` |

## Payload enviado al backend

```json
{
  "channel": "whatsapp",
  "user_id": "<uuid del JWT verificado>",
  "display_name": "Nombre del negocio",
  "user_name": "Nombre del usuario",
  "email": "contacto@negocio.com",
  "phone_number": "+526621234567",
  "phone_number_id": "123456789012345",
  "waba_id": "..."
}
```

`channel` se fija en el servidor a un valor de `messagingChannels`. El formulario ya **no**
pide ni reenvía `access_token`.

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

El backend FastAPI puede escribir la fila sin service role key, vía dos endpoints de
este proyecto (`X-Internal-Secret: {BACKEND_INTERNAL_SECRET}`):

| Endpoint | Archivo | Equivalente en el backend |
| --- | --- | --- |
| `POST /api/public/whatsapp/connections/upsert` | `src/routes/api/public/whatsapp/connections/upsert.ts` | `save_pending` |
| `PATCH /api/public/whatsapp/connections/status` | `src/routes/api/public/whatsapp/connections/status.ts` | `update_status` |

Lógica compartida en `src/lib/whatsapp/connections.server.ts`. Solo persisten
`user_id`, `status`, `phone_display` y `chatwoot_inbox_id`; las credenciales que venga
en el body (`display_name`, `phone_number_id`, `waba_id`, `access_token`) se aceptan pero
se ignoran y nunca se loguean. Contratos completos en `src/lib/database/README.md`.
