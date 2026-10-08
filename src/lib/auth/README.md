# Backend auth cutover

## Flags

| Variable | Where | Default | Role |
| --- | --- | --- | --- |
| `BACKEND_AUTH_ENABLED` | server | off (`!== "true"`) | When `true`, login/register hit jira; session is a stored JWT; serverFns verify with `AUTH_JWT_SECRET`. |
| `AUTH_JWT_SECRET` | server | required when flag on | HS256 secret shared with jira `auth_service`. |
| `BACKEND_URL` | server | existing | Base URL for `POST /auth/login` and `POST /auth/register`. |
| `BACKEND_INTERNAL_SECRET` | server | existing | Sent on auth relays when set; required on onboarding relays with Bearer. |

With the flag **off**, Supabase Auth is unchanged (`signInWithPassword` / `signUp` / `requireSupabaseAuth` path via `requireAppAuth`).

## Endpoints

- `POST {BACKEND_URL}/auth/register` → `access_token`, `user_id`, `tenant_id`, `email`, `tenant_slug`
- `POST {BACKEND_URL}/auth/login` → same

JWT claims: `sub` = `users.id`, `tenant_id`, `email`.

## How to test

1. **Flag off** (default): leave `BACKEND_AUTH_ENABLED` unset. Sign up / log in with Supabase; dashboard and billing behave as today.
2. **Flag on**: set `BACKEND_AUTH_ENABLED=true` and `AUTH_JWT_SECRET` to the same value as jira. Register with first/last/tenant name; token is stored in `localStorage`; serverFns send `Authorization: Bearer`. Checkout metadata includes `tenant_id` + `user_id` (Postgres UUIDs). Onboarding skips `POST /tenants/provision/supabase`.
