# Nombres en los dos pasos del onboarding

## Qué cambia

**Paso 1 (cuenta de la plataforma de conversaciones, `POST /onboarding`)**
- El formulario pide ahora tres datos: Correo electrónico, Nombre del usuario y Nombre del negocio.
- Se envían al backend como `email`, `name` y `company_name`.

**Paso 2 (conexión de WhatsApp, `POST /onboarding/connection`)**
- Hoy pide dos nombres ("Nombre del negocio" y "Nombre del usuario"). Se deja **un solo campo**, etiquetado "Nombre de la cuenta de WhatsApp".
- Se envía al backend como `waba_name` (se dejan de enviar `display_name` y `user_name`).

Nada más cambia: teléfono, Phone number ID, WABA ID, Api Key, guía de Meta, validación con Graph API, estados de la tarjeta y IDs de la plataforma resueltos en el servidor quedan igual. No hay cambios de base de datos.

## Detalle técnico

- `src/lib/chatwoot/schema.ts`: añadir `name` y `companyName` (trim, requeridos, máx. 80).
- `src/components/dashboard/ChatwootAccountCard.tsx`: dos inputs nuevos + errores por campo; el valor inicial de nombre/negocio queda vacío.
- `src/lib/chatwoot/account.functions.ts` y `account.server.ts`: propagar los campos; body pasa a `{ user_id, email, name, company_name }`.
- `src/lib/whatsapp/schema.ts`: reemplazar `displayName` + `userName` por `wabaName`.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: quitar un input, renombrar el otro, ajustar `EMPTY`.
- `src/lib/whatsapp/onboarding.server.ts`: `ConnectWhatsAppInput.wabaName`; body envía `waba_name`.
- `src/lib/whatsapp.functions.ts`: pasar `wabaName`.
- Actualizar los contratos documentados en `src/lib/whatsapp/README.md` y `src/lib/database/README.md`.
