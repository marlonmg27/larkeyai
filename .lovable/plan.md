# Card de onboarding de WhatsApp en el dashboard

Nueva tarjeta que solo aparece cuando el usuario ya paga pero aún no tiene WhatsApp conectado.

## Cuándo se muestra

Se muestra si **ambas** condiciones se cumplen:

- La suscripción está activa (`subscription_status` en `active` o `trialing`).
- Su fila en `whatsapp_connections` tiene `status` distinto de `connected`, o no existe fila.

Si el usuario no tiene suscripción activa, o ya está `connected`, la tarjeta no se renderiza.

## Contenido de la tarjeta

Título "Conecta tu WhatsApp" + descripción corta en español, con formulario:

- Nombre a mostrar del negocio (texto)
- Phone number ID (texto)
- WABA ID — WhatsApp Business Account ID (texto)
- Access token (campo tipo password, con botón de mostrar/ocultar)

Botón "Guardar conexión": por ahora solo hace `console.log` de los valores. Validación básica con zod (campos requeridos, límites de longitud) y mensajes de error inline.

Nota de seguridad: en el `console.log` el access token se imprime enmascarado (solo longitud/últimos caracteres), no en texto plano, para no dejar credenciales en la consola del navegador.

## Detalles técnicos

- Nuevo componente `src/components/dashboard/WhatsAppOnboardingCard.tsx` (Card + Input + Label + Button de shadcn, `react-hook-form` + `zod` si ya están disponibles; si no, estado local controlado).
- La lectura de `whatsapp_connections` se añade a `fetchDashboard` en `src/routes/_authenticated/dashboard.tsx` como una consulta más del `Promise.all` (`select status, phone_display` con `eq("user_id", userId).maybeSingle()`), expuesta en `DashboardData` como `whatsapp: { status } | null`.
- La tarjeta se renderiza en la vista de cliente activo, arriba de la sección de packs.
- Sin cambios de base de datos y sin escrituras: la tabla ya permite solo lectura al usuario; el guardado real llegará cuando se conecte al backend.
