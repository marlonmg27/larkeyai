# Validar el número con la Graph API antes de enviarlo al backend

Al guardar la conexión de WhatsApp, primero se comprueba con Meta que el número
ingresado realmente pertenece a una WhatsApp Business Account. Solo si la
verificación pasa, se reenvía el onboarding al backend de Python.

## Comportamiento

1. El usuario llena el formulario (negocio, usuario, email, teléfono, Phone number ID, WABA ID).
2. Al enviar, el servidor consulta la Graph API usando `WABA_ACCESS_TOKEN`:
   - Lee los números de la WhatsApp Business Account indicada y busca el `Phone number ID` capturado.
   - Compara el `display_phone_number` que devuelve Meta con el número E.164 del formulario.
3. Resultados posibles:
   - **Coincide** → se envía el onboarding al backend igual que hoy.
   - **No coincide / no existe** → no se envía nada al backend y el formulario muestra el error
     debajo del campo correspondiente, en español:
     - "Ese Phone number ID no existe en la WhatsApp Business Account indicada" (sobre Phone number ID).
     - "El número no coincide con el registrado en la WhatsApp Business Account (+1555…)" (sobre el
       teléfono), mostrando el número que Meta tiene registrado para que el usuario lo corrija.
     - "No pudimos validar el número con WhatsApp en este momento. Inténtalo de nuevo."
       (error de red/token, mensaje general arriba del botón).

El formulario no cambia de campos ni de diseño; solo aparecen estos errores nuevos.

## Detalles técnicos

- Nuevo `src/lib/whatsapp/graph.server.ts`:
  - `verifyPhoneBelongsToWaba({ wabaId, phoneNumberId, phoneNumber })`.
  - `GET https://graph.facebook.com/v25.0/{wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status`
    con `Authorization: Bearer ${process.env['WABA_ACCESS_TOKEN']}` (leído dentro del handler),
    `AbortSignal.timeout(10_000)`.
  - Fallback: si esa llamada responde 400/403 por permisos de la cuenta, consulta
    `GET /v25.0/{phoneNumberId}?fields=display_phone_number,verified_name` y valida solo el número.
  - Normaliza ambos lados a dígitos (`display_phone_number` viene con `+`, espacios y guiones) y
    compara con los dígitos del E.164 del formulario.
  - Devuelve una unión discriminada: `{ ok: true, displayPhoneNumber, verifiedName }` o
    `{ ok: false, reason: 'phone_number_id_not_found' | 'phone_mismatch' | 'unavailable',
    field: 'phoneNumberId' | 'phoneNumber' | null, expected?: string }`.
  - Nunca loguea el token; los logs solo llevan `user_id`, `status` y `reason`.
- `src/lib/whatsapp.functions.ts`: dentro del handler de `connectWhatsAppAccount`, antes de
  `connectWhatsApp(...)`, importa dinámicamente `graph.server.ts` y ejecuta la verificación.
  Si falla, devuelve `{ ok: false, verification: { field, message } }` en lugar de lanzar,
  para que la card pinte el error en el campo correcto. El caso de éxito sigue devolviendo
  el resultado actual del backend (se amplía el tipo de retorno con `ok`/`verification`).
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: en `onSuccess` de la mutación, si la
  respuesta trae `verification`, coloca el mensaje en `errors[field]` (o en el bloque de error
  general) y no muestra el estado de éxito.
- `src/lib/whatsapp/README.md`: se documenta el paso de verificación con Graph API, la versión
  de API usada y que `WABA_ACCESS_TOKEN` es un secreto de servidor.
- Prueba: se valida el flujo con el número `+1 555 645 3784` para confirmar que pasa la
  verificación, y con un número alterado para confirmar el error de "no coincide".
