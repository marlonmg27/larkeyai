# Conexión de WhatsApp: `connect-whatsapp`

Objetivo: que el formulario de onboarding deje de hacer `console.log` y envíe realmente los datos al backend de Python, con el usuario verificado del lado del servidor.

Nota técnica importante: en este proyecto (TanStack Start) la lógica de servidor no se hace con Edge Functions de Supabase, sino con *server functions* seguras que corren en el servidor de la app. Es el mismo patrón que ya usa la facturación con Stripe (`X-Internal-Secret`, `BACKEND_URL`). Cumple exactamente los 4 puntos pedidos: sesión verificada, body validado, POST al backend con el secreto interno, y respuesta/errores claros al frontend.

## Qué se va a construir

1. `src/lib/whatsapp/onboarding.server.ts`
   - `connectWhatsApp({ userId, displayName, phoneNumberId, wabaId, accessToken })`.
   - `POST ${BACKEND_URL}/onboarding/whatsapp` con headers `Content-Type: application/json` y `X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}` (leídos dentro del handler).
   - Body: `user_id`, `display_name`, `phone_number_id`, `waba_id`, `access_token`.
   - Timeout de 15 s, y devuelve la respuesta del backend tal cual cuando es 2xx.
   - Errores traducidos a mensajes claros: backend sin configurar, tiempo de espera agotado, backend no disponible, o el mensaje de error que devuelva el backend (recortado). Nunca se registra el access token en logs.

2. `src/lib/whatsapp.functions.ts`
   - `connectWhatsAppAccount` = server function `POST` con `.middleware([requireSupabaseAuth])`, por lo que el `user_id` sale del token verificado y **no** del body (si el body trae `user_id`, se ignora).
   - Validación con Zod igual a la del formulario (nombre ≤ 80, IDs ≤ 64, token ≤ 512).

3. `src/components/dashboard/WhatsAppOnboardingCard.tsx`
   - Sustituir el `console.log` por una mutación (`useServerFn` + `useMutation`).
   - Botón con estado "Conectando…" y deshabilitado durante el envío.
   - Éxito: mensaje de confirmación, limpiar el token del estado local, e invalidar la consulta del dashboard para que se refresque el estado de la conexión.
   - Error: alerta con el mensaje devuelto, sin perder lo que el usuario escribió.

## Detalles

- Reutiliza los secretos ya existentes `BACKEND_URL` y `BACKEND_INTERNAL_SECRET`; no se piden secretos nuevos.
- No se escribe en `whatsapp_connections` desde el frontend: el backend de Python es el dueño de esa tabla (el usuario solo tiene SELECT). El estado `pending/connected` lo actualiza el backend.
- Sin cambios de base de datos y sin cambios en el flujo de Stripe.
- Si el backend aún no expone `/onboarding/whatsapp`, el formulario mostrará el error de conexión de forma controlada, sin romper el dashboard.
