# TODO

Pendientes detectados durante la prueba E2E del onboarding (2026-10-07). Por ahora solo están anotados; todavía no se arreglan.

## Seguridad
- [ ] El `.env` está versionado en este repo público. Sacarlo del índice (`git rm --cached .env`), dejarlo en `.gitignore` y rotar los secretos que ya se expusieron (secreto interno del backend, token de WABA, llaves de Supabase).
- [ ] El dashboard muestra en texto plano una contraseña temporal fija (`src/lib/chatwoot.ts:14`).

## Frontend
- [ ] Con Node 20 no hay `WebSocket` global, así que `createClient()` de supabase-js truena dentro de `requireSupabaseAuth` y ninguna server function autenticada llega a ejecutarse. Usar Node 22 o más nuevo (o `--experimental-websocket` como parche).
- [ ] Los errores de las server functions regresan con HTTP 200 y el dashboard cae en silencio a los datos de Supabase (`src/routes/_authenticated/dashboard.tsx:208-215`). Mostrar el error en lugar de usar ese respaldo.
- [ ] Mientras carga el estado del onboarding, el dashboard muestra los datos de Supabase como si fueran los reales.
- [ ] `src/lib/backend-url.server.ts:36-38` solo acepta `BACKEND_URL` con https y lo rechaza sin avisar; en local no sirve con `http://localhost`.
- [ ] El motivo del error del backend no se registra en el log (`src/lib/onboarding/backend.server.ts:31-35`).
- [ ] `WhatsAppOnboardingCard.tsx:133`: un error se muestra como si hubiera salido bien.
- [ ] URL de Chatwoot en Railway muerta, codificada a mano (`src/lib/chatwoot.ts:7-8`).
- [ ] Dos fechas de renovación distintas (`dashboard.tsx:350` vs `SubscriptionOverview.tsx:62`).
- [ ] La etiqueta "Activo" sale con cualquier estado de suscripción (`dashboard.tsx:339-341`).
- [ ] El login no muestra ningún error cuando falla (400 de Supabase sin mensaje).
- [ ] El correo del Paso 1 viene fijo con el del login; si ese correo ya existe en Chatwoot, el alta falla.
- [ ] Las server functions no tienen middleware CSRF (aviso de TanStack Start).

## Backend (repo Larkey)
- [ ] No se guardan el id ni el secreto del webhook de Chatwoot (`chatwoot_adapter.py:137-142`).
- [ ] Orden de las validaciones en `onboarding_service.py:103/112`.
- [ ] Quedan cuentas huérfanas en Chatwoot si falla la creación del usuario (`onboarding_service.py:86-110`).
- [ ] El `X-Internal-Secret` se valida después de buscar al usuario (`onboarding_router.py`).
- [ ] El upsert de `ai_agents` puede quedarse con el número de otro agente (`ai_agents_client.py:25-36`).
- [ ] No se guarda ni se devuelve el motivo del fallo del Paso 2.
- [ ] No se registra el cuerpo de los errores 422 de Chatwoot (`chatwoot_client.py:179`).
- [ ] El estado `pending` nunca se guarda.
- [ ] `EmailStr` rechaza dominios reservados.

## Arquitectura y datos
- [ ] Hay dos fuentes de verdad para `subscription_status`: `users` de Supabase y `tenants` del backend.
- [ ] El dashboard aún tiene datos viejos en el Supabase de Lovable (`whatsapp_connections` en `pending`, `chatwoot_user_id`/`chatwoot_account_id` en `users`).
- [ ] Limpiar los datos de prueba: tenant "Larkey E2E Test", cuenta 36 de Chatwoot y `ai_agents` id 77.

## Después
- [ ] Probar el flujo de Stripe (faltan las llaves).
- [ ] Probar el agente (LLM, MCP, Calendar).
