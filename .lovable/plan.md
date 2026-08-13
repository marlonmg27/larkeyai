# Por qué no viste la guía ni el botón de Chatwoot

Verifiqué el dashboard y la base de datos. Las dos filas de `whatsapp_connections` creadas en tus pruebas quedaron con `status = 'connected'` (el backend las marca así casi de inmediato).

Eso choca con cómo está armado el dashboard hoy:

- La guía de Chatwoot vive **dentro** de la card de onboarding de WhatsApp.
- Esa card sólo se renderiza cuando `status !== 'connected'`.
- La guía sólo aparece en el estado "acabo de enviar el formulario" (memoria de la sesión, no dato guardado).

Resultado: en cuanto el backend marca `connected` (o si recargas la página), la card entera desaparece y con ella la guía, las credenciales y el botón para entrar a Chatwoot. Nunca alcanzaste a verlas.

## Qué haré (sólo frontend)

Sacar la guía de Chatwoot de la card de onboarding y convertirla en una sección propia y permanente del dashboard.

1. Nueva card "Tu plataforma de conversaciones", visible siempre que el usuario tenga suscripción activa **y** exista fila en `whatsapp_connections` (cualquier status, incluido `connected`).
2. Dentro de la card, la guía actual: credenciales (email del usuario autenticado + contraseña temporal `Default123!`) con botones de copiado, el botón grande "Entrar a mi plataforma de conversaciones", y las instrucciones con las capturas de Settings → Inboxes → Add Inbox.
3. Las instrucciones largas de "si tu inbox falló" quedan en un bloque colapsable para que la card no sea gigante; las credenciales y el botón siempre visibles.
4. La card de onboarding conserva su mensaje de éxito corto tras enviar el formulario, pero ya no es la única puerta a la guía.
5. Encabezado de la card según status: `connected` → "Tu WhatsApp está conectado"; `pending` → "Estamos activando tu conexión"; `error` → aviso de reintento apuntando a los mismos pasos.

## Detalles técnicos

- `src/components/dashboard/ChatwootSetupGuide.tsx`: se vuelve reutilizable (prop opcional de status, sección 4 dentro de un colapsable). Sin cambios en `src/lib/chatwoot.ts`.
- `src/routes/_authenticated/dashboard.tsx`: `fetchWhatsappConnection` ya devuelve el status; se añade una condición nueva `showChatwootAccess = hasActiveSubscription && whatsapp !== null` y se renderiza la nueva card debajo de `SubscriptionOverview`.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: deja de renderizar la guía completa; mantiene el mensaje de confirmación.
- Sin cambios en base de datos, server functions ni contratos con el backend.
