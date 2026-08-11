# Corregir la verificación del webhook de Stripe

## Diagnóstico confirmado

Los logs de producción muestran este error en cada entrega:

```text
SubtleCryptoProvider cannot be used in a synchronous context.
Use await constructEventAsync(...) instead of constructEvent(...)
```

Por tanto, el `400 invalid signature` no lo está causando el nuevo signing secret. El webhook usa `stripe.webhooks.constructEvent(...)`, que falla en el runtime publicado antes de verificar la firma.

El usuario de prueba más reciente sí tiene `stripe_customer_id`, pero continúa con `subscription_status = none`, `plan_id = null`, `trial_ends_at = null` y sin balance. Esto coincide con el flujo actual: el customer se crea y guarda al iniciar Checkout, mientras que la suscripción, el plan, el trial y el balance solo se aplican cuando el webhook se procesa correctamente. Además, `stripe_events` está vacío, confirmando que ninguna entrega llegó a persistirse.

## Cambios

1. En `src/lib/stripe/webhook.server.ts`, reemplazar la verificación síncrona por:
   - `await stripe.webhooks.constructEventAsync(rawBody, signature, secret)`.
   - Mantener el body crudo y el mismo manejo de firma inválida.

2. Mantener sin cambios la seguridad y el flujo posterior:
   - La firma seguirá siendo obligatoria.
   - Solo después de validarla se guardará el evento en `stripe_events`.
   - Después se ejecutará `apply_subscription_event`, que actualizará plan, estado, trial, periodo y balance.

3. Validar el arreglo:
   - Confirmar que el proyecto compila.
   - Confirmar que una petición sin firma continúa devolviendo `400 missing signature`.
   - Revisar los logs publicados para comprobar que desapareció el error de `SubtleCryptoProvider`.

4. Recuperar la suscripción que quedó pendiente:
   - Tras publicar el arreglo, reenviar desde Stripe los eventos fallidos de esa sesión, especialmente `checkout.session.completed` y los eventos de suscripción relacionados.
   - Verificar en la base de datos que se llenen `plan_id`, `subscription_id`, `subscription_status`, `trial_ends_at`, `current_period_end` y `usage_balance`.
   - Verificar que los eventos aparezcan en `stripe_events` y que el reenvío al backend quede registrado.

## Alcance técnico

No requiere cambios de esquema, secretos ni frontend. El `stripe_customer_id` existente es válido y no debe borrarse. Los eventos fallidos no pueden corregirse retroactivamente solo con código: Stripe debe reenviarlos después de publicar el fix.
