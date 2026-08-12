# Estructura base de Embedded Signup de WhatsApp (botón desactivado)

Todo queda montado pero inactivo: el botón aparece deshabilitado con la etiqueta "Próximamente / En proceso de aprobación de Meta" hasta que Meta apruebe la app.

## Dónde aparece

Dentro de la card "Conecta tu canal de mensajería", al seleccionar el canal **WhatsApp**, arriba del formulario manual actual:

```text
[ ← Cambiar de canal ]

Conexión rápida (recomendada)
[ Conectar WhatsApp Business ]  (deshabilitado)
Próximamente / En proceso de aprobación de Meta

────────── o conecta manualmente ──────────

[ formulario actual, sin cambios ]
```

El formulario manual sigue funcionando exactamente igual.

## Piezas nuevas

1. **Carga condicional del SDK de Facebook** — un hook que inyecta
   `https://connect.facebook.net/en_US/sdk.js` una sola vez, solo en el navegador,
   solo cuando el canal WhatsApp está seleccionado y solo si existe el App ID
   configurado. Llama a `FB.init({ appId, version: 'v23.0', xfbml: false, cookie: true })`.
   Si el flag está apagado, el SDK ni se carga (no se descarga script de terceros
   innecesariamente); el botón se muestra deshabilitado igual.

2. **Botón + lógica lista** — `launchEmbeddedSignup()` con
   `FB.login(cb, { config_id, response_type: 'code', override_default_response_type: true,
   extras: { setup: {}, featureType: '', sessionInfoVersion: '3' } })`, que lee
   `response.authResponse.code` y lo pasa al paso 3. También queda escrito el listener de
   `message` para los eventos `WA_EMBEDDED_SIGNUP` (waba_id / phone_number_id), guardados
   en estado local. Nada de esto se ejecuta mientras el botón esté deshabilitado.

3. **Envío del `code` al backend** — server function autenticada
   `completeEmbeddedSignup` (`requireSupabaseAuth`, el `user_id` sale del JWT) que hace
   `POST ${BACKEND_URL}/onboarding/whatsapp/embedded_signup` con
   `X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}` y body
   `{ user_id, code, waba_id?, phone_number_id? }`. Nunca se loguea el `code`.
   El `code` no se manda desde el navegador al backend directamente: pasa por el
   server function para no exponer el secreto interno.

4. **Feature flag** — `VITE_WHATSAPP_EMBEDDED_SIGNUP_ENABLED` (default `false`).
   En `false`: botón `disabled`, tooltip/etiqueta de "Próximamente", SDK sin cargar y
   server function que responde `{ ok: false, reason: "disabled" }` sin llamar al backend.
   Para activar en el futuro: poner el flag en `true` (y nada más).

## Detalles técnicos

- `src/lib/whatsapp/embedded-signup.ts`: constantes de config (`appId`, `configId`,
  `graphVersion`, `enabled`) leídas de `import.meta.env.VITE_FB_APP_ID`
  (valor: `871512495342882`), `VITE_FB_WHATSAPP_CONFIG_ID` (vacío por ahora) y
  `VITE_WHATSAPP_EMBEDDED_SIGNUP_ENABLED` (`false`).
- `src/hooks/use-facebook-sdk.ts`: carga idempotente del script + `FB.init`, con tipos
  mínimos para `window.FB` (sin `any` suelto).
- `src/components/dashboard/EmbeddedSignupButton.tsx`: botón, etiqueta estática,
  tooltip (shadcn `Tooltip`), estados de carga/error, y la lógica de `FB.login` +
  listener de `message` lista para usarse.
- `src/lib/whatsapp/embedded-signup.functions.ts`: `completeEmbeddedSignup`
  (server function `POST`, Zod: `code` requerido máx. 512, `wabaId`/`phoneNumberId`
  opcionales).
- `src/lib/whatsapp/embedded-signup.server.ts`: fetch a
  `${BACKEND_URL}/onboarding/whatsapp/embedded_signup` reutilizando
  `resolveBackendBaseUrl`, timeout de 15 s, sin loguear credenciales.
- `WhatsAppOnboardingCard.tsx`: renderiza el bloque nuevo + separador cuando
  `channel === "whatsapp"`.
- Actualización de `src/lib/whatsapp/README.md` con el contrato del nuevo endpoint.
- Sin cambios de base de datos, ni de Stripe, ni del formulario manual.

## Sobre el `config_id`

El `config_id` es el ID de una **configuración de Embedded Signup** que se crea en el
panel de Meta, no un dato de la app en sí:

1. developers.facebook.com → tu app (871512495342882) → producto **WhatsApp** →
   **Embedded Signup** (también aparece como "Configuraciones de registro integrado").
2. Crear una configuración: eliges los permisos/`featureType`, el tipo de solución
   (Tech Provider / onboarding de clientes) y las opciones de precarga.
3. Al guardarla, Meta muestra un **ID de configuración** numérico: ese es el `config_id`.

Requisito previo: la app necesita el caso de uso de WhatsApp Business con los permisos
`whatsapp_business_management` y `whatsapp_business_messaging`, y estar aprobada como
Tech Provider — por eso el botón queda deshabilitado hasta entonces. Cuando tengas el
número, lo cargo en `VITE_FB_WHATSAPP_CONFIG_ID` y solo falta poner el flag en `true`.

