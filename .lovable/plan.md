# Quitar el input de access token y dejar la validación de Graph API comentada

Cambio mínimo: el formulario de conexión de WhatsApp ya no pide access token, y la
verificación con la Graph API queda comentada en el código para poder reactivarla
después solo descomentando.

## Comportamiento

- El formulario mantiene los mismos campos (negocio, usuario, email, teléfono con
  selector de país, Phone number ID, WABA ID) menos el campo "Access token".
- Al enviar, el onboarding va directo al backend de Python. Ya no se consulta a Meta,
  así que desaparecen los errores "Ese Phone number ID no existe…" y "El número no
  coincide…". Los demás estados (cargando, éxito, error del backend) no cambian.
- El backend sigue recibiendo `access_token` con el valor de `WABA_ACCESS_TOKEN` del
  servidor, como hoy.

## Detalles técnicos

- `src/lib/whatsapp/schema.ts`: se comenta el campo `accessToken` del schema Zod
  (bloque completo con una nota de "reactivar junto con la verificación Graph API").
- `src/lib/whatsapp.functions.ts`: se comenta el `import()` dinámico de
  `graph.server` y el bloque de verificación con su `if (!verification.ok)`.
  El handler sigue devolviendo `verification: null` para no cambiar el tipo de
  retorno, así la card no necesita refactor.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: se elimina el input de
  Access token (label, input password con mostrar/ocultar, texto de ayuda y
  `errors.accessToken`) y el `accessToken: ""` del estado inicial. Se conserva el
  manejo de `verificationError` (queda inerte mientras la validación esté comentada).
- `src/lib/whatsapp/graph.server.ts`: se deja el archivo intacto, sin uso, listo para
  volver a importarse.
- `src/lib/whatsapp/README.md`: nota de que la verificación con Graph API está
  desactivada temporalmente y cómo reactivarla.
- Sin cambios de base de datos, Stripe, endpoints públicos ni Realtime.
