
# Backend de pagos: Suscripciones + Packs adicionales

Solo backend en este paso (DB + server functions + webhook + secretos). Frontend después. Todo el código Stripe se aísla en `src/lib/stripe/*` y `src/routes/api/public/stripe/*` con contratos documentados para portarlo tal cual a un microservicio FastAPI.

## Aclaración sobre "activación manual"

`activate_client(p_user_id, p_plan_id, p_phone)` es una función SQL con `SECURITY DEFINER` restringida a `service_role`. La ejecutas desde el editor SQL o desde tu backend Python con la service key. **No se elimina**: queda como escape hatch de admin para excepciones (cortesías, migraciones, soporte). Flujo normal: lead → Stripe Checkout → webhook activa. Nadie puede activarse desde la UI.

## Planes definidos

| Plan          | Mensajes/mes | Mensual (MXN) | Anual -20% (MXN) | ~$/msg |
|---------------|--------------|---------------|------------------|--------|
| Basic         | 7,000        | 2,000         | 19,200           | 0.286  |
| Standard      | 12,000       | 3,200         | 30,720           | 0.267  |
| Pro           | 20,000       | 5,000         | 48,000           | 0.250  |

**Standard @ 3,200 MXN**: se posiciona entre Basic (0.286/msg) y Pro (0.250/msg) con un $/msg intermedio (0.267), preservando el escalón hacia Pro y evitando canibalizar Basic. Anual = mensual × 12 × 0.8.

**Cambio futuro documentado en Basic**: 6,000 mensajes por 1,900 MXN (~0.317/msg). Se deja como comentario SQL en la fila del plan Basic y en `src/lib/stripe/README.md` con nota de cómo migrar (crear nuevo `stripe_price_id`, marcar el actual como `active=false`, dejar clientes existentes en el price viejo hasta renovación).

## Packs adicionales confirmados (solo para suscritos activos)

| Pack   | Mensajes | Precio (MXN) |
|--------|----------|--------------|
| Small  | 5,000    | 1,600        |
| Medium | 15,000   | 4,200        |
| Large  | 40,000   | 10,000       |

## Free Trial: 14 días **sin tarjeta**, con tope de uso

Evalué las dos opciones:

- **Con tarjeta**: mejor tasa de conversión post-trial y menos abuso, pero fricción alta al inicio y menos leads llegan a probar.
- **Sin tarjeta**: más leads prueban el producto (adecuado para B2B en fase temprana como Larkey), pero riesgo de abuso (múltiples cuentas para mensajes gratis) y menor conversión.

**Recomiendo sin tarjeta, con estas mitigaciones para el abuso**:
1. **Tope de mensajes durante el trial**: 500 msgs (no 7,000). Suficiente para evaluar, insuficiente para operar. Si los agota antes de los 14 días, debe suscribirse para seguir. Se implementa creando `usage_balance` con `messages_remaining=500` durante el trial; al convertir a pago, `apply_subscription_event` sube el balance al del plan completo y resetea el período.
2. **Un trial por email** (unique en `users.email`, ya existe) y **un trial por teléfono** cuando se active (unique blando vía `activate_client`).
3. **Trial solo se otorga al iniciar el primer checkout de suscripción** (no al signup). Así el lead ya tomó una acción de intención y podemos requerir teléfono en ese paso.
4. En el checkout de Stripe se usa `trial_period_days=14` con `payment_method_collection='if_required'` — Stripe permite el trial sin método de pago. Al día 14 la suscripción entra en `past_due` si no se agregó método; el webhook la cancela y el balance queda en 0.

Si tras 1-2 meses ves abuso, migramos a "con tarjeta" cambiando un flag en `plans` (`trial_requires_payment_method boolean`) sin tocar código de UI. Documentado en el README.

## Cambios en base de datos (una migración)

1. **`plans`**: agregar `billing_interval` (`'month' | 'year'`), `stripe_price_id text unique`, `tier text` (`'basic' | 'standard' | 'pro'`), `active boolean default true`, `trial_days int default 14`, `trial_message_cap int` (500 para todos por ahora), `trial_requires_payment_method boolean default false`. Recrear filas: 6 planes (basic/standard/pro × mensual/anual). Los `stripe_price_id` se llenan tras crearlos en Stripe.
2. **`message_packs`** (nueva): `id`, `code`, `messages`, `price_mxn`, `stripe_price_id unique`, `active`, timestamps. RLS: `SELECT` público; sin write desde cliente. GRANT `SELECT` a `anon, authenticated`; `ALL` a `service_role`.
3. **`users`**: agregar
   - `stripe_customer_id text unique` (nullable)
   - `subscription_status text` (`'none' | 'trialing' | 'active' | 'past_due' | 'canceled'`), default `'none'`
   - `subscription_id text unique` (nullable)
   - `trial_ends_at timestamptz`, `current_period_end timestamptz`, `cancel_at_period_end boolean default false`
   - El trigger `prevent_protected_user_columns_update` se extiende para bloquear también estas columnas a cualquier rol que no sea `service_role`.
4. **`purchases`**: agregar `pack_id uuid references message_packs(id)` (nullable), `stripe_session_id text unique`. Mantener columna `package` por retrocompat.
5. **`stripe_events`** (nueva, idempotencia webhook): `id text primary key`, `type text`, `payload jsonb`, `processed_at timestamptz default now()`. Solo `service_role`.
6. **`can_buy_pack(p_user_id uuid) returns boolean`**: true solo si `subscription_status IN ('active','trialing')`. Ejecutable por `authenticated` y `service_role`.
7. **`apply_subscription_event(...)`** (`SECURITY DEFINER`, solo `service_role`): único punto de escritura de estado de suscripción y `usage_balance` desde el webhook (crear balance al iniciar trial con `trial_message_cap`, subir a full al convertir, renovar al inicio de cada período, marcar `past_due`, cancelar sin borrar balance).
8. **`activate_client` se conserva sin cambios**. Comentario SQL: "escape hatch de admin; no usar en flujo self-service".

Todas las tablas nuevas: CREATE → GRANT → ENABLE RLS → CREATE POLICY. Sin `anon` en datos de usuario.

## Secretos

Ya presentes: `STRIPE_TEST_API_KEY`, `STRIPE_WEBHOOK_SECRET`. No pido nada más para test.

## Capa Stripe aislada (portable a FastAPI)

```
src/lib/stripe/
  client.server.ts          # inicializa Stripe con STRIPE_TEST_API_KEY
  contracts.ts              # tipos DTO (CheckoutRequest, WebhookEvent, ...)
  checkout.server.ts        # createSubscriptionCheckout, createPackCheckout
  customers.server.ts       # getOrCreateCustomer(userId)
  subscriptions.server.ts   # cancelAtPeriodEnd, resumeSubscription, changePlan
  webhook.server.ts         # verifyAndDispatch(event) → llama apply_subscription_event / add_purchased_messages
  README.md                 # contrato, eventos, mapping a FastAPI, política de trial y de cambio de precios
src/lib/billing.functions.ts   # server functions que la UI llamará después
src/routes/api/public/stripe/webhook.ts   # endpoint público, firma verificada
```

Reglas de aislamiento:
- Ningún componente React importa `stripe`; solo usa server functions de `billing.functions.ts`.
- Los server functions solo llaman a `src/lib/stripe/*` y a RPCs SQL (`apply_subscription_event`, `add_purchased_messages`, `can_buy_pack`). Cero SQL crudo a `users`/`usage_balance` desde TypeScript.
- El `README.md` documenta: mapa evento Stripe → función SQL, formato de metadata en Checkout Sessions (`user_id`, `plan_id` o `pack_id`, `mode`), contrato exacto del endpoint webhook (headers, raw body, respuesta), política de trial y migración de precios. Esa es la spec para FastAPI.

## Server functions expuestas (contratos, sin llamarse aún)

Todas con `requireSupabaseAuth`. Ninguna toca `supabaseAdmin` para autorización — el webhook es el único que escribe estado de suscripción.

- `createSubscriptionCheckout({ planId })`: rechaza si ya está `active`/`trialing` (salvo cambio de plan → `changePlan`). Crea Checkout Session `mode=subscription`, `trial_period_days=14`, `payment_method_collection='if_required'`. Devuelve `url`.
- `createPackCheckout({ packId })`: llama `can_buy_pack`; si false, rechaza "Necesitas una suscripción activa". Session `mode=payment`. Devuelve `url`.
- `cancelSubscription()`: `cancel_at_period_end=true` en Stripe. Webhook actualiza.
- `resumeSubscription()`: revierte cancelación.
- `changePlan({ planId })`: `subscriptions.update` con proration. Webhook aplica balance.
- `listInvoices()`: lee del customer en Stripe, no persiste.

## Webhook `/api/public/stripe/webhook`

- Verifica firma con `STRIPE_WEBHOOK_SECRET` sobre el body raw.
- Inserta `stripe_events(id, ...)`; si conflicto por PK → 200 idempotente.
- Eventos manejados:
  - `checkout.session.completed` (mode=subscription) → `apply_subscription_event('started', ...)`: activa balance con `trial_message_cap`, guarda `customer_id`, `subscription_id`, `trial_ends_at`, status=`trialing`.
  - `checkout.session.completed` (mode=payment) → `add_purchased_messages(user_id, messages, pack_code, amount, session_id)`.
  - `customer.subscription.updated` → actualiza status, `current_period_end`, `cancel_at_period_end`, plan. Si pasa de `trialing` a `active`, sube balance al del plan completo.
  - `customer.subscription.deleted` → status=`canceled`. No borra `usage_balance` (queda hasta `period_end` para plan pagado; queda en 0 para trial no convertido).
  - `invoice.paid` → renueva `usage_balance` del período.
  - `invoice.payment_failed` → status=`past_due`. Stripe reintenta (Smart Retries, hasta 3 semanas); tras último fallo → `subscription.deleted`.
- Logs por evento; nunca loguea secretos.

## Flujo lead → suscriptor self-service (paralelo al manual)

1. Lead se registra → `handle_new_user` crea fila en `users` sin plan.
2. Lead entra al dashboard, ve CTA "Empieza tu prueba de 14 días" / "Suscríbete".
3. UI llama `createSubscriptionCheckout({ planId })` → redirige a Stripe (sin pedir tarjeta si eligió trial).
4. Cliente confirma → Stripe redirige a `/dashboard?checkout=success`.
5. Webhook recibe `checkout.session.completed` → `apply_subscription_event` crea `usage_balance` con 500 msgs, `status='trialing'`, `plan_id`, `trial_ends_at`.
6. Dashboard hace refetch, muestra "En prueba (500 msgs, quedan X días)".
7. Al día 14: si el cliente agregó método de pago → `invoice.paid` → balance sube al del plan completo, status=`active`. Si no → `subscription.deleted` → status=`canceled`, balance 0.

Flujo manual (admin) intacto: `select activate_client(user_id, plan_id, phone)` desde SQL. NO crea customer en Stripe; documentado en README el procedimiento para linkearlo si el cliente después migra a self-service.

## Fuera de alcance (siguiente paso)

- UI del dashboard: botones Suscribirse / Cambiar plan / Cancelar / Comprar pack, página de éxito, listado de facturas, banner de trial.
- Migración a producción (claves live, verificación de dominio, subdomain para webhook).
- Emails transaccionales (Stripe los envía por defecto).

## Detalles técnicos

- Runtime: TanStack `createServerFn` para funciones internas, `createFileRoute('/api/public/stripe/webhook')` con `server.handlers.POST` para el webhook (body raw, sin auth, firma verificada dentro).
- Stripe SDK: `stripe` npm, cargado dinámicamente dentro del handler.
- Idempotencia: PK en `stripe_events.id`.
- Concurrencia: `apply_subscription_event` en transacción; webhook responde 200 solo si commiteó.
- Precios en Stripe: se crean una vez en el dashboard de Stripe (te doy la lista exacta con nombres y montos en el siguiente step) y sus IDs se guardan en `plans.stripe_price_id` / `message_packs.stripe_price_id`.

Confirma para arrancar la migración e implementación.
