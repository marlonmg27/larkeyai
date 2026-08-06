# Acceso a la base de datos desde el backend (contrato FastAPI)

Este documento define cómo el backend de Python (FastAPI) lee, crea y actualiza
registros en la base de datos de Lovable Cloud — la única base de billing, uso y
suscripciones del producto.

**Regla de oro: los nombres de tablas y columnas son un contrato fijo.** El
backend se conecta a esta misma base con la service role key; no renombrar nada
sin coordinar el cambio en ambos lados.

## Credenciales (secretos ya provisionados)

| Secreto | Uso |
| --- | --- |
| `SUPABASE_URL` | Base del API REST: `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Key de service role: salta RLS, escribe como `service_role` |
| `SUPABASE_DB_URL` | Connection string directa a Postgres (SQLAlchemy/asyncpg) |

Los valores se leen del entorno del backend; nunca van al cliente ni a logs.
Si la key empieza con `sb_secret_`, ver el gotcha de headers más abajo.

## Dos vías de conexión

### 1. Data API REST con service role key (recomendada)

Endpoints HTTP simples (httpx/requests, sin SDK):

- Insert: `POST {SUPABASE_URL}/rest/v1/<tabla>`
- Update: `PATCH {SUPABASE_URL}/rest/v1/<tabla>?<columna>=eq.<valor>`
- Funciones: `POST {SUPABASE_URL}/rest/v1/rpc/<funcion>`
- Headers: `apikey: <key>`, `Authorization: Bearer <key>`, `Content-Type: application/json`

Salta RLS por diseño. El trigger de protección de `users` deja pasar porque el
claim JWT de la sesión es `service_role` — el mismo camino que ya usa el webhook
de Stripe de este proyecto.

### 2. Conexión directa a Postgres

`SUPABASE_DB_URL` con SQLAlchemy/asyncpg/psycopg. SQL completo y RLS salteado,
pero **cuidado con el trigger `users_prevent_protected_columns_update`**:

Una conexión directa no lleva claim JWT (`request.jwt.claims` es NULL), y el
trigger bloquea entonces las actualizaciones a columnas protegidas de `users`
con el error `Action not allowed`:

`id`, `email`, `phone`, `plan_id`, `stripe_customer_id`, `subscription_id`,
`subscription_status`, `trial_ends_at`, `current_period_end`, `cancel_at_period_end`.

Para tocar esas columnas, usar la Data API o las funciones RPC (que actualizan
`users` internamente). Todo lo demás — `usage_balance`, `purchases`,
`whatsapp_connections`, inserts en `users` — funciona sin problema por conexión
directa.

## Esquema y dueños de escritura

| Tabla | Contenido | Quién escribe |
| --- | --- | --- |
| `users` | Cliente: plan, teléfono, estado de suscripción | Webhook de Stripe (este proyecto) y `activate_client` manual |
| `usage_balance` | Saldo de mensajes del periodo | Funciones RPC (no escribir directo) |
| `purchases` | Historial de compras de packs | `add_purchased_messages` (webhook) |
| `whatsapp_connections` | Conexión de WhatsApp del cliente | **Backend FastAPI** (único dueño de escritura) |
| `plans` | Catálogo de planes (suscripción) | Solo admin / migraciones |
| `message_packs` | Catálogo de packs de mensajes | Solo admin / migraciones |
| `stripe_events` | Bitácora de eventos de Stripe | Webhook de Stripe (lectura para el resto) |

El frontend solo lee: `users`, `usage_balance`, `purchases` y
`whatsapp_connections` tienen RLS por propietario (SELECT con `auth.uid()`, y el
trigger impide tocar columnas protegidas de `users`); `plans` y `message_packs`
son de lectura pública.

## Funciones RPC disponibles para `service_role`

Permisos verificados en la base (ACL). Llamar siempre por
`POST {SUPABASE_URL}/rest/v1/rpc/<funcion>`:

| Función | Parámetros | Devuelve | Propósito |
| --- | --- | --- | --- |
| `decrement_messages` | `p_user_id`, `p_count` | `void` | Restar mensajes consumidos |
| `can_send_message` | `p_user_id` | `boolean` | ¿Tiene saldo? |
| `add_purchased_messages` | `p_user_id`, `p_messages`, `p_package`, `p_amount`, `p_stripe_payment_id` | `void` | Acreditar un pack comprado |
| `apply_subscription_event` | `p_user_id`, `p_action`, `p_plan_id`, `p_stripe_customer_id`, `p_subscription_id`, `p_trial_ends_at`, `p_current_period_end`, `p_cancel_at_period_end` | `void` | Sincronizar suscripción desde Stripe |
| `activate_client` | `p_user_id`, `p_plan_id`, `p_phone` | `void` | Activación manual (admin) |
| `can_buy_pack` | `p_user_id` | `boolean` | ¿Puede comprar packs? |
| `reset_expired_usage_balances` | — | `void` | Renovar periodos vencidos |

## Flujo recomendado: mensaje entrante de WhatsApp

Al recibir un mensaje de un cliente:

1. `can_send_message(user_id)` — si es `false`, no responder con el agente.
2. Procesar con Agno/Chatwoot.
3. `decrement_messages(user_id, 1)` por cada mensaje consumido.

Siempre por RPC, nunca escribiendo `usage_balance` directo: la lógica queda
centralizada en una sola función y el saldo no se desincroniza.

## Ejemplos

### RPC: consultar saldo y decrementar (httpx)

```python
import httpx

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}
BASE = f"{SUPABASE_URL}/rest/v1"

# ¿Puede enviar? -> respuesta JSON: [true] o [false]
r = httpx.post(f"{BASE}/rpc/can_send_message", json={"p_user_id": user_id}, headers=HEADERS)
r.raise_for_status()
can_send = r.json()[0]

# Consumir un mensaje (función void -> 200/204 sin cuerpo)
r = httpx.post(f"{BASE}/rpc/decrement_messages", json={"p_user_id": user_id, "p_count": 1}, headers=HEADERS)
r.raise_for_status()
```

### Actualizar la conexión de WhatsApp (dueño de escritura: FastAPI)

```python
# Marcar como conectada
r = httpx.patch(
    f"{BASE}/whatsapp_connections?user_id=eq.{user_id}",
    json={"status": "connected", "phone_display": "+52 662 000 0000"},
    headers=HEADERS,
)
r.raise_for_status()
```

El `status` respeta el enum fijo `not_connected | pending | connected | error`
(contrato documentado en `src/lib/whatsapp/README.md`).

### Conexión directa (SQLAlchemy) — solo para lo no protegido

```python
from sqlalchemy import create_engine, text

engine = create_engine(SUPABASE_DB_URL)
with engine.connect() as conn:
    ok = conn.execute(text("SELECT public.can_send_message(:uid)"), {"uid": user_id}).scalar()
    # Actualizar usage_balance directo NO se recomienda; usar decrement_messages.
```

## Gotchas

- **Keys `sb_secret_`**: si la key no es un JWT clásico, PostgREST rechaza
  `Authorization: Bearer <key>` con `Expected 3 parts in JWT; got 1`. Enviar solo
  el header `apikey` (sin `Authorization`), igual que hace este proyecto.
  `supabase-py` puede requerir un shim de fetch; con httpx no hay problema.
- **Service role salta RLS**: mantener la key solo en el servidor, nunca en el
  cliente ni en logs.
- **Trigger en `users`**: las columnas protegidas solo se actualizan por la Data
  API con `service_role` (o por funciones RPC); una conexión directa las bloquea
  con `Action not allowed`.
- **Manejo de errores**: PostgREST responde no-2xx con
  `{"code": "42501", "message": "...", "hint": "..."}`; los `RAISE EXCEPTION` de
  las funciones llegan como `P0001` con el mensaje de la excepción.
- **Nota de seguridad observada**: hoy `authenticated` también tiene `EXECUTE`
  sobre `decrement_messages`, `add_purchased_messages` y `apply_subscription_event`
  (un usuario con sesión podría llamarlas desde el navegador, p. ej. decrementar
  con número negativo para aumentar su saldo). Se recomienda revocar y dejar solo
  `service_role` + `postgres` — endurecimiento pendiente, fuera de este documento.

## Dirección inversa (eventos hacia el backend)

Además de leer/escribir, este proyecto ya empuja eventos a FastAPI:

- `POST {BACKEND_URL}/webhooks/subscription` con
  `X-Internal-Secret: {BACKEND_INTERNAL_SECRET}` — eventos de Stripe normalizados.
- `POST {BACKEND_URL}/onboarding/whatsapp` — credenciales de WhatsApp enviadas
  por el cliente desde el dashboard.

Detalles en `src/lib/stripe/README.md` y `src/lib/whatsapp/README.md`.
