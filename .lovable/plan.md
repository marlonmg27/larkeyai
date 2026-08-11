# Diagnosticar y corregir los errores del webhook de Stripe

## Respuesta directa a tu pregunta

**Base URL:** `https://larkeyai.lovable.app`
**Endpoint:** `/api/public/stripe/webhook`
**URL completa:** `https://larkeyai.lovable.app/api/public/stripe/webhook`

Esa es exactamente la URL que Stripe ya tiene configurada, y es la correcta. El problema no es la URL: el endpoint está vivo y funcionando.

## Diagnóstico (verificado)

- Probé el endpoint publicado: con firma ausente responde `400 missing signature`. Eso confirma que:
  - La ruta está desplegada y accesible.
  - El secreto `STRIPE_WEBHOOK_SECRET` SÍ está configurado (si faltara, respondería `500 webhook secret not configured`).
- El flujo del handler (`src/lib/stripe/webhook.server.ts`):
  1. Verifica la firma con `STRIPE_WEBHOOK_SECRET` (`constructEvent`).
  2. Si la firma no coincide → devuelve `400 invalid signature`.
  3. Persiste el evento en `stripe_events`; duplicados → `200 duplicate`.
  4. Aplica el estado local y reenvía al backend (nunca afecta la respuesta a Stripe).

**Conclusión:** el correo "webhook endpoint with errors" casi seguro se debe a que el **signing secret** que Stripe generó para ese endpoint (`whsec_...`) NO coincide con el valor guardado como `STRIPE_WEBHOOK_SECRET` en Lovable. Es el error más común y el único que produce fallos con esta configuración y URL correctas.

## Qué se va a hacer

### 1. Confirmar el error real en Stripe (1 min)
En el Dashboard de Stripe → Developers → Webhooks → abrir el endpoint
`https://larkeyai.lovable.app/api/public/stripe/webhook` → pestaña "Attempts".
Revisar el último intento fallido y su código de estado HTTP:

| Estado | Causa | Arreglo |
|--------|-------|---------|
| `400 invalid signature` | El `whsec` no coincide con `STRIPE_WEBHOOK_SECRET` | Paso 2 |
| `500 handler failed` / `persist failed` | Fallo interno al procesar | Me avisas y lo reviso |
| Timeout | El reenvío al backend tarda demasiado | Paso 3 (mejora opcional) |

### 2. Sincronizar el signing secret (la causa más probable)
1. En el mismo endpoint de Stripe, botón "Reveal signing secret" → copia el valor `whsec_...`.
2. Actualizo `STRIPE_WEBHOOK_SECRET` en Lovable con ese valor exacto (por `update_secret`, se te abre el formulario seguro).
3. Disparas un evento de prueba desde Stripe y confirmo que responde `200 ok`.

> Si el secreto de Stripe se regenera alguna vez (Stripe lo hace por seguridad), hay que repetir el paso 2.

### 3. Mejora opcional: responder rápido a Stripe (solo si hay timeouts)
Hoy el handler hace `await forwardToBackend(...)` (hasta 10 s) antes de devolver el `200` a Stripe. Si `BACKEND_URL` está caído o lento, la respuesta a Stripe se retrasa y Stripe puede marcar timeout.

Cambio: desacoplar el reenvío para que la respuesta `200` no dependa del backend. El evento ya quedó en `stripe_events`, así que se puede reprocesar; el tracking de `forwarded_to_backend` se mantiene.

No aplico este cambio a menos que la pestaña de intentos muestre timeouts (paso 1).

## Detalles técnicos

- **Archivos:** ninguno cambia si solo es el paso 2 (configuración de secreto). El paso 3 toca `src/lib/stripe/webhook.server.ts` (mover el reenvío para que no bloquee la respuesta) y `backend-forward.server.ts` (marcar `forwarded_to_backend` sin bloquear).
- **Sin cambios de esquema, sin cambios de UI.**
- Los 5 eventos configurados (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`) ya están cubiertos por el handler.
