# Documentar el contrato de acceso a la base de datos para el backend FastAPI

## Objetivo

Crear un documento de referencia único que defina cómo el backend de Python (FastAPI)
puede leer, crear y actualizar registros en la base de datos de Lovable Cloud, siguiendo
el mismo estilo de los READMEs existentes (`src/lib/stripe/README.md`,
`src/lib/whatsapp/README.md`).

Este es un trabajo de documentación puro: no hay migraciones, ni cambios de código,
ni cambios de secretos.

## Qué se crea

Un solo archivo nuevo: `src/lib/database/README.md`

## Contenido del documento

### 1. Dos vías de conexión (ambas verificadas en la base real)

- **Data API REST con la service role key (recomendada)**
  - `POST/PATCH {SUPABASE_URL}/rest/v1/<tabla>` para insertar/actualizar.
  - `POST {SUPABASE_URL}/rest/v1/rpc/<funcion>` para llamar las funciones SQL existentes.
  - Headers: `apikey` + `Authorization: Bearer <key>`.
  - Salta RLS por diseño y el trigger de protección de `users` deja pasar porque el
    claim JWT es `service_role`. Es el mismo camino que ya usa el webhook de Stripe.
- **Conexión directa a Postgres (SQLAlchemy/asyncpg) con `SUPABASE_DB_URL`**
  - SQL completo, RLS salteado.
  - Advertencia verificada en vivo: una conexión directa no lleva claim JWT
    (`request.jwt.claims` es NULL), así que el trigger `users_prevent_protected_columns_update`
    bloquea actualizar columnas protegidas de `users` con "Action not allowed":
    `id`, `email`, `phone`, `plan_id`, `stripe_customer_id`, `subscription_id`,
    `subscription_status`, `trial_ends_at`, `current_period_end`, `cancel_at_period_end`.
  - Todo lo demás funciona sin problema por esta vía: `usage_balance`, `purchases`,
    `whatsapp_connections`, e inserts en `users`.

### 2. Esquema y dueños de escritura (nombres fijos, no renombrar)

Tabla por tabla: `users`, `usage_balance`, `purchases`, `whatsapp_connections`, `plans`,
`message_packs`, `stripe_events` — columnas clave, quién escribe qué:

- El frontend solo lee (RLS por propietario).
- El webhook de Stripe de este proyecto aplica suscripciones y packs.
- El backend FastAPI es dueño de la escritura en `whatsapp_connections` y del decremento
  de uso (según el flujo ya documentado en `src/lib/whatsapp/README.md`).

### 3. Funciones RPC disponibles para `service_role` (permisos verificados)

Tabla con firma y propósito:

| Función | Firma | Propósito |
|---|---|---|
| `decrement_messages` | `(p_user_id uuid, p_count int)` | Restar mensajes usados |
| `can_send_message` | `(p_user_id uuid) -> boolean` | Consultar si hay saldo |
| `add_purchased_messages` | `(p_user_id, p_messages, p_package, p_amount, p_stripe_payment_id)` | Acreditar pack |
| `apply_subscription_event` | `(p_user_id, p_action, ...)` | Sincronizar estado de suscripción |
| `activate_client` | `(p_user_id, p_plan_id, p_phone)` | Activación manual |
| `can_buy_pack` | `(p_user_id) -> boolean` | Consultar si puede comprar |
| `reset_expired_usage_balances` | `()` | Renovación mensual |

### 4. Flujo recomendado para mensajes entrantes de WhatsApp

`can_send_message(user_id)` para consultar saldo y `decrement_messages(user_id, 1)` al
consumir un mensaje — siempre por RPC, nunca escribiendo `usage_balance` directo, para
mantener la lógica centralizada en una sola función.

### 5. Gotchas

- Si la key empieza con `sb_secret_`, enviar el header `apikey` en vez de
  `Authorization: Bearer` (igual que hace este proyecto); `supabase-py` puede requerir
  un shim de fetch.
- La service role key salta RLS por diseño: mantenerla solo en el servidor, nunca en el
  cliente.
- `whatsapp_connections.status` es un contrato fijo: `not_connected`, `pending`,
  `connected`, `error` (referencia al README existente de WhatsApp).
- Nota de seguridad observada: hoy `authenticated` también tiene `EXECUTE` sobre
  `decrement_messages`, `add_purchased_messages` y `apply_subscription_event` — el
  documento lo señala y recomienda revocarlo (endurecimiento pendiente, fuera de este
  alcance).

### 6. Ejemplos HTTP listos para copiar (curl y httpx)

- Insert en `purchases` / update en `usage_balance`.
- RPC `decrement_messages` y `can_send_message`.
- Manejo de errores no-2xx y del trigger (mensaje "Action not allowed").

## Qué NO incluye

- Migraciones ni cambios de esquema.
- Cambios de código de la app.
- Cambio de secretos ni exposición de sus valores.

## Verificación

Es markdown puro sin build que compilar; la verificación es una lectura del archivo
final para confirmar que los ejemplos coinciden con el esquema real y los nombres de
funciones verificados.
