# Connectors: Google Calendar en el área privada

Nueva sección "Connectors" en el menú lateral (solo con sesión iniciada) con la opción "Google Calendar" y su propia página privada.

## Qué verá el usuario

Página `/connectors/google-calendar` (privada, dentro del área autenticada):

- Si aún no conectó su cuenta: botón **Conectar Google Calendar**, que abre una ventana de Google para dar permiso. Al terminar, la ventana se cierra y la página muestra la confirmación.
- Ya conectado:
  - Lista de los **próximos 10 eventos**: título, fecha y hora (formateados en español, hora local del usuario). Si un evento es de día completo, se indica así.
  - Botón **Crear evento de prueba**: crea un evento de 30 minutos que empieza en la siguiente media hora, llamado "Evento de prueba de Larkey", y refresca la lista.
  - Botón **Desconectar**, para quitar el acceso.
- Estados de carga, de error y un aviso claro de "vuelve a conectar" si Google pide renovar el permiso.

El menú lateral gana un grupo "Connectors" con la entrada "Google Calendar", visible solo con sesión; el resto del menú queda igual.

## Requisito previo

Ya existe un cliente de Google Calendar en el espacio de trabajo, pero todavía no está vinculado a este proyecto. Antes de escribir el código se abrirá la tarjeta de conexión para vincularlo (eso trae la clave que el servidor necesita). En la configuración de Google hay que tener como URI de redirección autorizada:
`https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`

No se implementa OAuth a mano y no se guardan tokens de Google: la conexión la gestiona el conector de Lovable.

## Detalles técnicos

- Vincular el cliente con `connector_app_user--connect_client` (`connector_id: google_calendar`), que sincroniza `GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY` y `APP_USER_CONNECTION_KEY_SECRET`.
- Nuevo helper server-only `src/integrations/lovable/appUserConnector.ts` exactamente como en la guía de Lovable (`authorizeAppUserOAuth`, `callAsAppUser`, `exchangeAppUserOAuthCode`, `disconnectAppUser`, `appUserReconnectRequired`).
- Almacenamiento de la clave de conexión por usuario (no tokens de Google): migración que crea `public.app_user_connections` (`user_id`, `connector_id`, `connection_key_ciphertext`, único por par), con GRANT solo a `service_role` y RLS activada. Cifrado AES-256-GCM en `src/server/connectionKeyCrypto.ts` con `APP_USER_CONNECTION_KEY_SECRET`; helpers `saveConnectionKeyForUser` / `getConnectionKeyForUser` / `deleteConnectionKeyForUser` en `src/server/appUserConnections.server.ts` usando `supabaseAdmin` importado dinámicamente.
- Server functions con `requireSupabaseAuth` (`src/lib/connectors/google-calendar.functions.ts`):
  - `startGoogleCalendarConnect` → `authorizeAppUserOAuth` con scopes `userinfo.email`, `userinfo.profile`, `https://www.googleapis.com/auth/calendar.events` y `calendar.readonly`; `returnUrl` = `/oauth/google-calendar/return`.
  - `completeGoogleCalendarConnection` → `exchangeAppUserOAuthCode` + guardado cifrado.
  - `listUpcomingEvents` → `GET /calendar/v3/calendars/primary/events?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=now`; devuelve solo id, título, inicio/fin y si es de día completo.
  - `createTestEvent` → `POST /calendar/v3/calendars/primary/events`.
  - `disconnectGoogleCalendar` → `disconnectAppUser` + borrar la fila.
  - Todas pasan `requiredScopes` y traducen un 401 de credenciales a `{ connected: false, reconnectRequired: true }`.
- Rutas nuevas: `src/routes/_authenticated/connectors/google-calendar.tsx` (UI con TanStack Query) y `src/routes/oauth/google-calendar/return.tsx` (página que devuelve el código de un solo uso a la ventana que la abrió).
- Flujo de conexión en popup (nunca redirigir la página), con el intercambio del código hecho desde la página principal, según la guía.
- Menú: nuevo grupo en `src/components/layout/AppSidebar.tsx` + textos en `src/i18n/es.ts` y `src/i18n/en.ts`.
- Sin cambios en pagos, WhatsApp, onboarding ni en el resto del sitio. Ruta excluida del prerenderizado (es privada).
