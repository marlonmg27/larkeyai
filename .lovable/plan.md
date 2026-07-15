## Plan: Add plans table, plan_id FK, billing SQL functions, and monthly reset job

All changes are backend-only (SQL migrations + one scheduled job). No frontend/UI edits. The existing `profiles.phone` column and the three existing tables are preserved — only additive changes plus the controlled drop of the old `profiles.plan` text column after backfill.

### Step 1 — Migration A: create `plans` and seed

Single migration that:

- Creates `public.plans` with columns: `id uuid pk default gen_random_uuid()`, `name text unique not null`, `messages_included integer not null`, `price numeric not null`, `created_at timestamptz default now()`.
- GRANTs: `SELECT` to `anon` and `authenticated` (public pricing), `ALL` to `service_role`.
- Enables RLS and adds a public `SELECT` policy (`USING (true)`) so pricing is readable by anyone.
- Seeds three rows with placeholder values marked `-- TODO: edit`:
  - `basic` → 100 messages, 0
  - `pro` → 1000 messages, 0
  - `enterprise` → 5000 messages, 0

### Step 2 — Migration B: add `profiles.plan_id`, backfill, drop old `plan`

Single migration that:

- `ALTER TABLE public.profiles ADD COLUMN plan_id uuid REFERENCES public.plans(id)`.
- Backfills: `UPDATE profiles SET plan_id = (SELECT id FROM plans WHERE name = profiles.plan)`; then a second `UPDATE` to set any remaining NULLs to the `basic` plan id.
- `ALTER COLUMN plan_id SET NOT NULL` and `SET DEFAULT` to the basic plan id (via subquery-safe approach: set default in a follow-up statement referencing the id).
- `ALTER TABLE public.profiles DROP COLUMN plan`.
- Leaves `phone` untouched.

### Step 3 — Migration C: update `handle_new_user` trigger function

Replace the function body so it:

- Looks up `basic_plan_id` and `basic_messages` from `plans` where `name = 'basic'`.
- Inserts into `profiles(id, email, phone, plan_id)` using `basic_plan_id`.
- Inserts into `usage_balance(user_id, messages_remaining, messages_used_period, period_start, period_end)` using `basic_messages` instead of the hardcoded `100`.

Trigger `on_auth_user_created` remains as-is (function replaced in place).

### Step 4 — Migration D: billing SQL functions

Create three `SECURITY DEFINER` functions with `SET search_path = public`:

- `decrement_messages(p_user_id uuid, p_count int)` — single `UPDATE usage_balance SET messages_remaining = messages_remaining - p_count, messages_used_period = messages_used_period + p_count WHERE user_id = p_user_id`. Atomic by nature of the single UPDATE.
- `can_send_message(p_user_id uuid) RETURNS boolean` — `SELECT messages_remaining > 0 FROM usage_balance WHERE user_id = p_user_id`.
- `add_purchased_messages(p_user_id uuid, p_messages int, p_package text, p_amount numeric, p_stripe_payment_id text)` — one `UPDATE usage_balance` + one `INSERT INTO purchases`, both inside the function (single transaction).

Execute grants: revoke from `public`, grant `EXECUTE` to `service_role` only (backend calls these). `can_send_message` also granted to `authenticated` in case the UI ever needs it.

### Step 5 — Confirm RLS

Verify (via `supabase--read_query` after migrations run) that RLS is still enabled on `profiles`, `usage_balance`, `purchases`, and that each keeps its per-user SELECT policy. The new `plans` public SELECT policy is added in Step 1. No changes to existing policies.

### Step 6 — Monthly reset via pg_cron

`pg_cron` is available on Lovable Cloud. Migration E:

- `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- Creates a SECURITY DEFINER function `reset_expired_usage_balances()` that runs:
  ```sql
  UPDATE usage_balance ub
  SET messages_remaining = p.messages_included,
      messages_used_period = 0,
      period_start = now(),
      period_end = now() + interval '1 month'
  FROM profiles pr
  JOIN plans p ON p.id = pr.plan_id
  WHERE ub.user_id = pr.id AND ub.period_end <= now();
  ```
- Schedules it daily at 03:00 UTC via `cron.schedule('reset-expired-usage-balances', '0 3 * * *', $$ SELECT public.reset_expired_usage_balances(); $$)`.

No Edge Function needed.

### Execution order & verification

Migrations are approved by you one at a time. After each is applied I'll run a short `supabase--read_query` to verify (row counts in `plans`, `profiles.plan_id` populated with no NULLs before dropping `plan`, functions exist via `pg_proc`, RLS flags via `pg_tables`, cron job present in `cron.job`) and only then move to the next migration.

### Not touched

- No frontend/UI changes.
- `profiles.phone` untouched.
- Existing RLS policies on `profiles`/`usage_balance`/`purchases` untouched.
- Existing trigger `on_auth_user_created` untouched (only its function body updated).
