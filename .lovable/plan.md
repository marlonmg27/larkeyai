# Card "Conecta tu canal de mensajería"

Cambio solo de frontend: selección de canal antes del formulario, campos nuevos y renombrado de `access_token` a `api_key`.

## 1. Selección de canal

La card pasa a titularse **"Conecta tu canal de mensajería"**. Antes de mostrar cualquier formulario aparece un listado de opciones de canal; por ahora solo **WhatsApp** (tarjeta seleccionable con ícono y descripción corta). Al elegirla se despliega el formulario de WhatsApp debajo. La estructura queda preparada para agregar más canales después (un mapa canal → formulario).

Mientras no haya canal seleccionado, no se muestra ningún campo. Se puede volver a cambiar de canal.

## 2. Campos del formulario de WhatsApp

Orden exacto:

1. Nombre del negocio
2. Nombre del usuario
3. Email
4. Phone number
5. Phone number ID
6. WABA ID
7. API Key (campo tipo password con mostrar/ocultar, antes "Access token")

Validación (Zod, compartida entre formulario y servidor):

- Nombre del usuario: requerido, máx. 80
- Email: requerido, formato email válido, máx. 160
- Phone number: requerido, máx. 20, formato telefónico permisivo (dígitos, espacios, `+`, `-`, paréntesis)
- API Key: mismas reglas que tenía el access token (requerido, máx. 512)
- El resto queda igual

## 3. Datos enviados al backend

El payload de `POST ${BACKEND_URL}/onboarding/whatsapp` pasa a incluir:

```json
{
  "channel": "whatsapp",
  "user_id": "<del JWT verificado>",
  "display_name": "...",
  "user_name": "...",
  "email": "...",
  "phone_number": "...",
  "phone_number_id": "...",
  "waba_id": "...",
  "api_key": "..."
}
```

`access_token` desaparece y se reemplaza por `api_key`. `channel` se fija en el servidor a partir del canal recibido, no se confía en texto libre del cliente.

## Detalles técnicos

- `src/lib/whatsapp/schema.ts`: renombrar `accessToken` → `apiKey`, agregar `userName`, `email`, `phoneNumber`, y `channel` como literal `z.enum(["whatsapp"])`.
- `src/lib/whatsapp/onboarding.server.ts`: `ConnectWhatsAppInput` con los campos nuevos; body con `channel`, `user_name`, `email`, `phone_number`, `api_key`. Se mantiene el timeout, el `X-Internal-Secret` y la regla de nunca loguear la credencial.
- `src/lib/whatsapp.functions.ts`: pasar los campos nuevos; el `user_id` sigue viniendo del JWT.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: selector de canal + formulario, título nuevo, campos nuevos, estados de carga/éxito/error sin cambios de comportamiento.
- Sin cambios de base de datos, de Stripe ni del flujo de Realtime. El README de WhatsApp se actualiza con el nuevo contrato de payload.
