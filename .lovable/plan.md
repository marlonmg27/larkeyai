
# Renombrar `profiles` → `users`

Nota: en fases previas pediste explícitamente no renombrar tablas ni columnas y que tu backend Python se conecta directo a este Supabase. Este cambio **rompe** ese backend hasta que también actualices las queries allí. Confirmado que asumes esa parte.

## Cambios en base de datos (una sola migración)

1. `ALTER TABLE public.profiles RENAME TO users;`  
   Postgres renombra automáticamente el índice PK y las FKs entrantes siguen apuntando al mismo objeto (ahora `users`). No hay pérdida de datos.
2. Recrear políticas RLS con el nuevo nombre (los `USING`/`WITH CHECK` no cambian, pero conviene renombrar los labels):
   - `Users can view their own profile` → `Users can view their own record`
   - `Users can update their own profile` → `Users can update their own record`
3. Actualizar GRANTs sobre `public.users` (mismos privilegios que hoy: `SELECT, UPDATE` a `authenticated`, `ALL` a `service_role`).
4. Actualizar cuerpos de funciones que referencian `public.profiles`:
   - `handle_new_user()` → `INSERT INTO public.users ...`
   - `activate_client(...)` → `UPDATE public.users ...` y check `FROM public.users`
   - `reset_expired_usage_balances()` → `JOIN public.users pr`
5. El trigger `on_auth_user_created` no se toca (sigue llamando a `handle_new_user`).
6. No se renombran columnas. No se tocan `plans`, `usage_balance` ni `purchases`. Las FKs `usage_balance.user_id` y `purchases.user_id` siguen apuntando al mismo id (ahora en `users`).

## Cambios en frontend

- `src/routes/_authenticated/dashboard.tsx`: cambiar `.from("profiles")` → `.from("users")`.
- `src/integrations/supabase/types.ts`: se regenera automáticamente tras la migración.

## Fuera de alcance (tú lo haces)

- Backend Python (FastAPI): actualizar todas las queries que usen `profiles` para que apunten a `users`.

## Lo que NO cambia

- Columnas de la tabla (`id`, `email`, `phone`, `plan_id`, `created_at`).
- Datos existentes.
- Otras tablas, sus FKs, sus policies.
- Lógica del dashboard, diseño, ni copy.
