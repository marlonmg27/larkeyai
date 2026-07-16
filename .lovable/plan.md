# Plan: separar "lead" de "cliente activo"

## Estado actual (revisado)

- **`profiles`**: columna `plan_id uuid NOT NULL DEFAULT '6e93713d-...'` (fuerza el plan Basic a todo signup).
- **`usage_balance`**: cada usuario tiene fila con `messages_remaining` = Basic incluidos, período de 1 mes.
- **`plans`**: catálogo (basic/pro/enterprise) — correcto.
- **`purchases`**: correcto, se llena vía `add_purchased_messages`.
- **Trigger `on_auth_user_created` → `handle_new_user()`**: al registrarse, inserta `profiles` con `plan_id = basic` **e** inserta `usage_balance` con los mensajes del Basic. Esto convierte cada signup en cliente pagante automáticamente.
- **`can_send_message`**: devuelve `messages_remaining > 0`; con el diseño nuevo, un lead sin balance debería devolver `false` (ya lo hace por `COALESCE`, ✓).
- **`reset_expired_usage_balances`**: reinicia balance al plan del profile. Debe seguir funcionando, pero solo debe tocar filas de usuarios que sí tienen `plan_id` (clientes activos).
- **Dashboard (`/dashboard`)**: asume que siempre existen `profiles.plans` y `usage_balance`. Con leads reales, ambos serán `null` → hoy muestra "Sin plan asignado" y 0/0, pero sin un mensaje claro de "cuenta pendiente de activación".
- **RLS**: los usuarios solo pueden leer sus propios `profiles`/`usage_balance`/`purchases`. Ningún path del cliente inserta plan o balance (solo lee). ✓

## Cambios requeridos (solo lo mínimo)

### 1. Esquema (`profiles`)
- Quitar el `DEFAULT` de `profiles.plan_id`.
- Hacer `profiles.plan_id` **nullable** (`DROP NOT NULL`). Un lead tendrá `plan_id = NULL` hasta que lo actives.
- No renombrar ni eliminar la columna.
- No tocar filas existentes (los usuarios ya creados conservan su `plan_id` actual).

### 2. Trigger `handle_new_user()`
Reescribir la función para que un signup **solo** cree la fila de `profiles` como lead:
- `INSERT INTO profiles (id, email, phone)` **sin** `plan_id` (queda `NULL`).
- **Eliminar** el `INSERT INTO usage_balance`. Un lead no tiene balance.
- Mantener `SECURITY DEFINER` y `search_path = public`.
- El trigger `on_auth_user_created` no se toca (sigue apuntando a la misma función).

### 3. Nueva función de activación manual (para uso tuyo desde el backend con service_role)
Añadir `public.activate_client(p_user_id uuid, p_plan_name text)`:
- Busca `plans` por `name`.
- Set `profiles.plan_id` al plan encontrado.
- `INSERT` en `usage_balance` (o `UPDATE` si ya existe) con `messages_remaining = plan.messages_included`, `messages_used_period = 0`, `period_start = now()`, `period_end = now() + 1 month`.
- `SECURITY DEFINER`, `search_path = public`, `EXECUTE` revocado de `anon`/`authenticated` — solo `service_role`. Así activas manualmente desde tu backend Python.

### 4. `reset_expired_usage_balances()`
Añadir filtro `AND pr.plan_id IS NOT NULL` en el `WHERE`, para que el reset ignore leads (por si en el futuro se hace `INSERT` prematuro). El `JOIN plans` ya lo excluye naturalmente, pero dejarlo explícito es más seguro.

### 5. `add_purchased_messages()`
Sin cambios de firma. Nota funcional: si intenta correr sobre un lead sin `usage_balance`, el `UPDATE` no afecta filas y solo se registra `purchases`. Recomendación: añadir un guard que lance excepción si no existe balance, para evitar cobros a leads no activados. **Cambio menor sugerido**, confirma si lo quieres incluido.

### 6. RLS / GRANTs
- Sin cambios en policies existentes.
- `REVOKE EXECUTE` de `activate_client` a `PUBLIC, anon, authenticated`; `GRANT EXECUTE` solo a `service_role`.

### 7. Dashboard (`src/routes/_authenticated/dashboard.tsx`)
- Detectar el caso "lead" (`data.plan === null` **y** `data.balance === null`) y mostrar un estado dedicado: mensaje tipo "Tu cuenta está registrada. Contacta con nosotros para activar tu plan." + ocultar tarjetas de uso/consumo/compras (o mostrarlas vacías con CTA de contacto).
- No tocar diseño para clientes activos.

## Lo que **NO** cambia
- Nombres de tablas y columnas (incluido `phone`).
- Datos existentes.
- `plans`, `purchases`, `can_send_message`, `decrement_messages`.
- Policies RLS existentes.
- Trigger `on_auth_user_created` (solo cambia el cuerpo de la función que invoca).

## Preguntas antes de generar SQL
1. ¿Añado el guard en `add_purchased_messages` para rechazar compras de leads sin `usage_balance`?
2. La función `activate_client`: ¿te vale que reciba `plan_name` (`'basic'`/`'pro'`/`'enterprise'`), o prefieres `plan_id uuid`?
