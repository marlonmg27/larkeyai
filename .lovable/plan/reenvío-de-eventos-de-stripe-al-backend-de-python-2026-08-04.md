# Reenvío de eventos de Stripe al backend de Python

## Contexto (verificado en el proyecto)

No hay Edge Function `stripe-webhook`. En este stack el webhook ya existe como ruta pública:
`src/routes/api/public/stripe/webhook.ts` → `src/lib/stripe/webhook.server.ts`.

Ya cumple los puntos 1–3 de tu lista:

- Verifica la firma con `STRIPE_WEBHOOK_SECRET` (`constructEvent` sobre el body en crudo).
- Inserta el evento completo en `stripe_events` (PK = `event.id`); si ya existía, responde 200 `duplicate` sin procesar.
- Además aplica el estado en la base de datos (`apply_subscription_event`, `add_purchased_messages`).

Falta lo nuevo: los puntos 4–6, el reenvío a `${BACKEND_URL}/webhooks/subscription`.
Los secretos `BACKEND_URL` y `BACKEND_INTERNAL_SECRET` ya están configurados.

## Qué se va a construir

1. **Idempotencia primero (ajuste de orden).** Hoy, si el manejador interno falla, el evento se borra de `stripe_events` y se responde 500 para que Stripe reintente. Se mantiene ese comportamiento para la parte de base de datos, pero el reenvío al backend se hará *después* de guardar el evento y nunca provocará un 500.

2. **Extracción del payload.** Un mapeador nuevo que, para cada evento manejado, saque:
   - `stripe_event_id`, `event_type`
   - `user_id`, `plan_id` (de `metadata` de la sesión / suscripción; si falta, se resuelve `user_id` por `stripe_customer_id` como ya se hace hoy)
   - `email` (del objeto de Stripe: `customer_email` / `customer_details.email` / `customer.email`)
   - `stripe_customer_id`, `stripe_subscription_id`
   - `status` (estado de la suscripción, o el estado del pago para packs)

3. **POST al backend.** `fetch(`${BACKEND_URL}/webhooks/subscription`)` con
   `Content-Type: application/json` y `X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}`,
   con timeout (10 s, `AbortSignal.timeout`) para no colgar la respuesta a Stripe.

4. **Tolerancia a fallos.** Cualquier error del POST (timeout, conexión rechazada, 4xx/5xx del backend, secretos ausentes) se captura, se registra con `console.error` incluyendo `event.id`, `event.type` y el motivo, y la respuesta a Stripe sigue siendo 200. El evento ya quedó en `stripe_events`, así que puedes reprocesarlo desde ahí.

## Detalles técnicos

- Archivo nuevo: `src/lib/stripe/backend-forward.server.ts` con `buildSubscriptionPayload(event)` y `forwardToBackend(payload)`.
- `src/lib/stripe/contracts.ts`: se añade el tipo `BackendSubscriptionPayload` (para portarlo luego a Pydantic).
- `src/lib/stripe/webhook.server.ts`: tras insertar en `stripe_events` y aplicar el estado local, llamada `await forwardToBackend(...)` envuelta en try/catch que nunca propaga.
- `process.env['BACKEND_URL']` y `process.env['BACKEND_INTERNAL_SECRET']` se leen dentro del handler, no en el ámbito del módulo.
- Se actualiza `src/lib/stripe/README.md` con el nuevo salto al backend.
- Sin cambios de base de datos, sin cambios de UI.

## Decisión pendiente (default asumido)

Se **mantiene** la aplicación local del estado en Supabase (`apply_subscription_event`, `add_purchased_messages`) *y además* se reenvía al backend, para no romper el dashboard actual. Si prefieres que la fuente única de verdad sea tu FastAPI y esta ruta solo guarde + reenvíe, dímelo y quito la aplicación local.
