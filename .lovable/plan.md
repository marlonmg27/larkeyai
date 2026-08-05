# Reenvío de eventos de Stripe al backend FastAPI — completar tracking

## Estado ya verificado en el proyecto

Casi todo lo pedido ya existe y funciona:

- `src/lib/stripe/webhook.server.ts` verifica la firma, inserta el evento en `stripe_events` (idempotencia por PK), aplica el estado local y **después** llama a `forwardToBackend(...)` dentro de un `try/catch` que nunca propaga; la respuesta a Stripe sigue siendo 200.
- `src/lib/stripe/backend-forward.server.ts` ya tiene `buildSubscriptionPayload(event)` (extrae `stripe_event_id`, `event_type`, `user_id`, `plan_id`, `pack_id`, `kind`, `email`, `stripe_customer_id`, `stripe_subscription_id`, `status`) y `forwardToBackend(payload)` con `Content-Type: application/json`, `X-Internal-Secret` y timeout de 10 s vía `AbortSignal.timeout`.
- El fallback de `user_id` por `stripe_customer_id` ya se aplica en `webhook.server.ts`.
- `BackendSubscriptionPayload` ya existe en `src/lib/stripe/contracts.ts`.
- `process.env['BACKEND_URL']` y `process.env['BACKEND_INTERNAL_SECRET']` se leen dentro de `forwardToBackend`, no en el ámbito del módulo.
- El README ya documenta el salto al backend.

Falta únicamente el **punto 2** (columnas de tracking y su escritura) y la **nota de temporalidad** del punto 9.

## Qué se va a construir

### 1. Migración de base de datos

Añadir a `stripe_events`:

- `forwarded_to_backend boolean not null default false`
- `forward_error text` (nullable)

Sin cambios de RLS ni de permisos: la tabla sigue siendo de acceso exclusivo del backend (service role).

### 2. Persistencia del resultado del reenvío

- `forwardToBackend(payload)` pasa a devolver un resultado (`{ ok: true }` o `{ ok: false, error: string }`) en lugar de `void`, sin lanzar nunca. Los motivos cubiertos: secretos ausentes, timeout, conexión rechazada y respuesta no-2xx (con status y un extracto del cuerpo).
- En `webhook.server.ts`, tras el reenvío, se actualiza la fila del evento:
  - éxito → `forwarded_to_backend = true`, `forward_error = null`
  - fallo → `forwarded_to_backend = false`, `forward_error = <motivo>`
- Ese `UPDATE` va también en `try/catch`: si falla, se registra con `console.error` y la respuesta a Stripe sigue siendo 200.
- Se mantiene el `console.error` actual con `event.id`, `event.type` y el motivo.

### 3. README

- Documentar las columnas `forwarded_to_backend` / `forward_error` y cómo reintentar desde `stripe_events`.
- Añadir nota explícita: `apply_subscription_event` y `add_purchased_messages` se aplican localmente de forma **TEMPORAL**, como puente; se eliminarán cuando `/webhooks/subscription` en FastAPI quede validado como fuente única de verdad.

## Fuera de alcance

Sin cambios de UI y sin tocar el flujo de checkout, la verificación de firma ni la lógica de estado local (se conserva como puente).
