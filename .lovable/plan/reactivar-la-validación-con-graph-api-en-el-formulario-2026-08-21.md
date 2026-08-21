# Reactivar la validación con Graph API en el formulario

Volver a comprobar con Meta, antes de enviar al backend, que el Phone number ID pertenezca al WABA indicado y que el número coincida con el registrado.

## Comportamiento

- Al enviar el formulario de WhatsApp, primero se valida contra la Graph API usando el valor del campo "Api Key" (si viene vacío se usa el `WABA_ACCESS_TOKEN` del servidor).
- Si falla, no se llama al backend de Python y el error se muestra en el campo correspondiente: "Ese Phone number ID no existe en la WhatsApp Business Account indicada." (Phone number ID) o "El número no coincide con el registrado…" (teléfono). Si Meta no responde, error general en la card.
- Si pasa, el flujo actual sigue igual: envío al backend, estado en tiempo real y guía de Chatwoot.

## Detalles técnicos

- `src/lib/whatsapp.functions.ts`: descomentar el `import()` de `@/lib/whatsapp/graph.server`, la llamada a `verifyPhoneBelongsToWaba` y el `if (!verification.ok)` con su retorno; el caso exitoso mantiene `verification: null`.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: restaurar el manejo en `onSuccess` (mapear `result.verification.field` a `errors`) y sustituir el `verificationError` fijo en `null` por estado real para que se muestre el mensaje general.
- `src/lib/whatsapp/graph.server.ts` y `schema.ts` (campo `accessToken`) ya están listos: sin cambios.
- Actualizar la nota de `src/lib/whatsapp/README.md` indicando que la validación vuelve a estar activa.
- Sin cambios de base de datos, Stripe ni endpoints públicos.
