# Api Key en el formulario + guía post-conexión de Chatwoot

## 1. Campo "Api Key" (access token)

- Vuelve el campo al formulario de WhatsApp connection, etiquetado **"Api Key"** solo en la UI (tipo password con mostrar/ocultar, máx. 512, texto de ayuda breve).
- Internamente sigue llamándose `accessToken` (se descomenta en `src/lib/whatsapp/schema.ts`, obligatorio) y se envía al backend en la clave `access_token` con el valor que escribió el usuario. Si viene vacío (no debería, es obligatorio) se usa `WABA_ACCESS_TOKEN` como respaldo. Nunca se escribe en logs.
- La verificación con Graph API sigue comentada; este cambio no la reactiva.

## 2. Guía post-envío (pantalla de éxito)

Al enviarse el formulario con éxito, la card muestra una guía en pasos en lugar de solo el mensaje corto:

1. **Tu cuenta ya está creada** — explica que ahí verá y tomará el control de sus conversaciones, y que debe entrar para configurar/agregar su cuenta de WhatsApp Business.
2. **Tus credenciales** — email ingresado + contraseña `Default123!`, con botones de copiar, y aviso de que debe cambiarla al entrar.
3. **Botón destacado** "Entrar a mi plataforma de conversaciones" → abre `${CHATWOOT_FRONTEND_URL}/app/login` en pestaña nueva.
4. **Si tu inbox falló o no llegan mensajes** — puede reintentar desde la plataforma: barra lateral → *Settings* → *Inboxes* → botón *Add Inbox* → canal *WhatsApp*, y llenar:
   - *Inbox Name*: nombre visible del negocio.
   - *Phone Number*: número en formato internacional (+52…).
   - *Phone number ID* y *Business Account ID (WABA ID)*: los mismos del panel de Meta.
   - *API Key*: el access token permanente de su app de Meta.
   - Nota: si su app de Meta aún no está aprobada, este paso puede fallar y puede escribirnos.
5. Ilustraciones de apoyo del panel (sidebar de Settings → Inboxes y formulario de nuevo inbox de WhatsApp) generadas como imágenes propias en `src/assets/`, con `alt` descriptivo, en vez de hotlinkear capturas de terceros (evita enlaces rotos y temas de licencia).

`CHATWOOT_FRONTEND_URL` queda como constante en un módulo nuevo `src/lib/chatwoot.ts` con valor `https://chatwoot-production-3b40.up.railway.app` (sobrescribible con `VITE_CHATWOOT_FRONTEND_URL`).

## 3. Leyenda para usuarios sin suscripción activa

En la vista del dashboard sin suscripción pagada, debajo del bloque de planes: texto pequeño en gris suave (mismo estilo que el aviso de fin de prueba) indicando que si aún no tiene una WhatsApp Business Account o una app de Meta, puede escribir a marlonmolinag12@gmail.com (enlace `mailto:`).

## Detalles técnicos

- `src/lib/whatsapp/schema.ts`: descomentar `accessToken` (requerido, máx. 512).
- `src/lib/whatsapp.functions.ts` y `src/lib/whatsapp/onboarding.server.ts`: pasar `accessToken` y enviarlo como `access_token`.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: input "Api Key" + nueva vista de éxito (extraída a `src/components/dashboard/ChatwootSetupGuide.tsx` para no engordar la card).
- `src/routes/_authenticated/dashboard.tsx`: leyenda del punto 3.
- `src/lib/whatsapp/README.md`: nota del campo Api Key y del flujo de Chatwoot.
- Sin cambios de base de datos, Stripe ni endpoints públicos.
