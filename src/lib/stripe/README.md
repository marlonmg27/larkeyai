# Stripe billing layer (Larkey)

This directory is the **entire** Stripe integration surface for the app.
Nothing outside `src/lib/stripe/*`, `src/lib/billing.functions.ts` and
`src/routes/api/public/stripe/webhook.ts` imports the `stripe` SDK.

The layout mirrors the future FastAPI microservice one-for-one so migration
is a copy/translate exercise, not a redesign.

## Files

| File | Responsibility | FastAPI equivalent |
|------|----------------|--------------------|
| `client.server.ts`      | Stripe SDK singleton, reads `STRIPE_TEST_API_KEY` | `stripe.api_key = ...` in `deps.py` |
| `contracts.ts`          | DTOs + event allow-list (no runtime deps)         | `schemas.py` (Pydantic models) |
| `customers.server.ts`   | `getOrCreateCustomer(user_id)`                    | `POST /internal/customers/ensure` |
| `checkout.server.ts`    | `createSubscriptionCheckout`, `createPackCheckout` | `POST /internal/checkout/{subscription,pack}` |
| `subscriptions.server.ts` | `cancelAtPeriodEnd`, `resumeSubscription`, `changePlan` | `POST /internal/subscriptions/{cancel,resume,change}` |
| `webhook.server.ts`     | `verifyAndDispatch(rawBody, signature)`           | `POST /webhooks/stripe` |

`src/lib/billing.functions.ts` is the only entrypoint the React app touches
(via `useServerFn`). To migrate to FastAPI, replace each `createServerFn`
in that file with an HTTP call to the microservice — every function has a
matching endpoint above.

## Environment

Required server secrets (already provisioned in Lovable Cloud):

- `STRIPE_TEST_API_KEY` — restricted or secret key. Test mode today; swap to `sk_live_...` for production.
- `STRIPE_WEBHOOK_SECRET` — used by `verifyAndDispatch` to check `x-stripe-signature`.
- `SITE_URL` (optional) — success/cancel redirect base. Falls back to `http://localhost:8080`.

## Product setup in Stripe

Create Products + Prices in the Stripe Dashboard (test mode), then paste
their `price_...` IDs into the DB. Everything else is already in place.

### Subscription prices (MXN, recurring)

| Tier     | Interval | Amount (MXN) | Notes |
|----------|----------|--------------|-------|
| Basic    | month    | 2,000        | 7,000 msgs/mo |
| Basic    | year     | 19,200       | −20% |
| Standard | month    | 3,200        | 12,000 msgs/mo |
| Standard | year     | 30,720       | −20% |
| Pro      | month    | 5,000        | 20,000 msgs/mo |
| Pro      | year     | 48,000       | −20% |

Then:

```sql
UPDATE public.plans SET stripe_price_id = 'price_xxx'
  WHERE tier = 'basic' AND billing_interval = 'month';
-- repeat for the other five rows
```

### One-time pack prices (MXN)

| Code    | Amount (MXN) | Messages |
|---------|--------------|----------|
| small   | 1,600        | 5,000    |
| medium  | 4,200        | 15,000   |
| large   | 10,000       | 40,000   |

```sql
UPDATE public.message_packs SET stripe_price_id = 'price_yyy' WHERE code = 'small';
-- repeat for medium, large
```

## Webhook

Endpoint: `POST /api/public/stripe/webhook`

Configure it in Stripe Dashboard → Developers → Webhooks with events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Stripe → our SQL mapping (via `apply_subscription_event`):

| Stripe event | Action | Effect |
|--------------|--------|--------|
| `checkout.session.completed` (mode=subscription, status=trialing) | `trial_started` | Creates `usage_balance` with `trial_message_cap` (default 500); status='trialing' |
| `checkout.session.completed` (mode=subscription, status=active)   | `activated`     | Full plan quota, fresh period |
| `checkout.session.completed` (mode=payment)                       | (calls `add_purchased_messages`) | Adds messages; inserts row in `purchases` |
| `customer.subscription.updated` → active                          | `activated`     | Full plan quota if not already; syncs `cancel_at_period_end` |
| `customer.subscription.updated` → past_due                        | `past_due`      | status change only |
| `invoice.paid` (billing_reason=`subscription_cycle`)              | `renewed`       | Reset quota + period_end |
| `invoice.payment_failed`                                          | `past_due`      | status change only |
| `customer.subscription.deleted`                                   | `canceled`      | status='canceled'; zeroes balance only if it was an unconverted trial |

Idempotency: every event is inserted into `stripe_events(id PK)`. Duplicate
deliveries short-circuit with 200.

## Trial policy

- 14 days, no payment method required (`payment_method_collection: if_required`).
- Trial balance is capped at `plans.trial_message_cap` (500 by default), NOT full plan quota.
- Once the trial converts to paid (`invoice.paid`) the balance is topped up to the full plan.
- To switch to card-required trials, flip `plans.trial_requires_payment_method = true`
  for the affected tiers — no code change needed.

## Changing plan pricing later

Planned: Basic → 6,000 msgs @ 1,900 MXN.

Procedure:

1. Create the new Price in Stripe (do NOT reuse the existing price).
2. `INSERT` a new row in `public.plans` with the new `stripe_price_id`,
   `messages_included=6000`, `price=1900`, `active=true`.
3. `UPDATE public.plans SET active = false WHERE id = <old basic month>;`
   Existing subscribers stay on the old price until they change plans.
4. Update `src/lib/stripe/README.md` and any UI copy referencing the old numbers.

## Admin escape hatch: `activate_client`

`public.activate_client(user_id, plan_id, phone)` remains available for
manual admin activation (courtesy accounts, migrations, support). It does
NOT create a Stripe subscription — if the customer later wants to
self-manage, run:

```sql
UPDATE public.users
   SET stripe_customer_id = 'cus_xxx',
       subscription_id    = 'sub_xxx',
       subscription_status= 'active'
 WHERE id = '...';
```

Then the normal webhook flow keeps them in sync.

## Migrating to FastAPI later

1. Copy `contracts.ts` → `schemas.py` (Pydantic).
2. Reimplement `client.server.ts`, `customers.server.ts`, `checkout.server.ts`,
   `subscriptions.server.ts`, `webhook.server.ts` on FastAPI. Each function
   maps to an endpoint listed in the table above.
3. Point the Stripe webhook at the FastAPI URL.
4. Replace the body of every server fn in `src/lib/billing.functions.ts`
   with `fetch("<microservice>/…")` (keep the same input/output shapes).
5. Delete `src/lib/stripe/*` and the `/api/public/stripe/webhook` route.

The React app never changes because it only touches
`src/lib/billing.functions.ts`.
