# Onboarding en dos pasos: cuenta de Chatwoot y conexión de WhatsApp

Hoy un solo formulario manda todo a `POST /onboarding`. Se divide en dos pasos secuenciales dentro del dashboard.

## Paso 1 — Crear la cuenta de la plataforma de conversaciones

Formulario nuevo, visible cuando el usuario todavía no tiene cuenta creada:

- Correo electrónico
- Contraseña
- Confirmar contraseña (debe coincidir; mínimo 8 caracteres)

Al enviar, se manda al backend `POST /onboarding` con el `user_id` de la sesión, el correo y la contraseña. El backend crea la cuenta y el usuario en Chatwoot y escribe `chatwoot_user_id` y `chatwoot_account_id` en la tabla `users` con service role. El frontend nunca escribe esos IDs: solo relee la fila del usuario y muestra el estado (enviando, error del backend, listo).

Mientras el backend no haya devuelto los IDs, el paso 2 aparece bloqueado con un mensaje explicando que primero hay que crear la cuenta. Hay un botón para actualizar el estado.

La contraseña se usa solo para esa llamada: no se guarda en la base de datos, no se registra en logs y no se vuelve a mostrar.

## Paso 2 — Conectar WhatsApp

Se habilita en cuanto el usuario ya tiene `chatwoot_user_id`. Es el formulario actual, con estos cambios:

- Se quita el campo **Email** (ya se capturó en el paso 1).
- Se mantienen: nombre del negocio, nombre del usuario, número de teléfono con selector de país, Phone number ID, WABA ID y Api Key.
- Se conserva la guía de Meta y la validación con Graph API antes de enviar.
- Ahora se envía a `POST /onboarding/connection`.
- Se agregan al cuerpo `chatwoot_user_id` y `chatwoot_account_id`, leídos en el servidor desde la fila del usuario — nunca capturados ni enviados por el navegador.

El resto del comportamiento (estado "en verificación", tarjeta de acceso a la plataforma, realtime de `whatsapp_connections`) se mantiene igual.

## Renombrar `users.chatwoot_id` → `chatwoot_user_id`

Se hace de forma segura en dos etapas, porque la app publicada sigue consultando la columna actual:

1. Ahora: migración que agrega `users.chatwoot_user_id` (bigint, nullable), copia los valores existentes de `chatwoot_id` y regenera los tipos. Todo el código nuevo usa `chatwoot_user_id`. `chatwoot_id` queda como columna heredada, sin uso en el frontend.
2. Más adelante, cuando confirmes que ya nada lee `chatwoot_id`, se puede eliminar en una migración aparte.

## Detalles técnicos

- Migración: `ALTER TABLE public.users ADD COLUMN chatwoot_user_id bigint;` + backfill `UPDATE ... SET chatwoot_user_id = chatwoot_id`. Luego regenerar `src/integrations/supabase/types.ts`.
- `src/lib/chatwoot/account.server.ts` (nuevo): puente server-only a `POST ${BACKEND_URL}/onboarding` con `X-Internal-Secret`, timeout de 15 s, normalización de URL vía `resolveBackendBaseUrl` y manejo de errores sin filtrar la contraseña.
- `src/lib/chatwoot/account.functions.ts` (nuevo): server fn con `requireSupabaseAuth`, validación Zod (email, password ≥ 8, confirmación) y `user_id` tomado del JWT.
- `src/lib/chatwoot/schema.ts` (nuevo): esquema compartido del paso 1.
- `src/lib/whatsapp/schema.ts`: se elimina `email` del esquema de onboarding.
- `src/lib/whatsapp/onboarding.server.ts`: cambia la ruta a `/onboarding/connection`, quita `email` y añade `chatwoot_user_id` / `chatwoot_account_id` al body.
- `src/lib/whatsapp.functions.ts`: antes de llamar al backend, lee `chatwoot_user_id` y `chatwoot_account_id` de `users` con el cliente autenticado; si faltan, devuelve un error claro de "primero crea tu cuenta".
- `src/components/dashboard/ChatwootAccountCard.tsx` (nuevo): formulario del paso 1.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: sin campo email, con estado bloqueado cuando falta la cuenta de Chatwoot.
- `src/routes/_authenticated/dashboard.tsx`: la consulta del dashboard también lee `chatwoot_user_id` y `chatwoot_account_id` para decidir qué paso mostrar.
- `src/lib/whatsapp/README.md` y `src/lib/database/README.md`: se documentan los dos endpoints y la columna nueva.
