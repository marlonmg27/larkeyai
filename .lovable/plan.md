# Onboarding de WhatsApp: envío real + estado en tiempo real

## Estado actual (verificado)

- El formulario **ya no hace `console.log`**: `WhatsAppOnboardingCard` ya invoca la server function `connectWhatsAppAccount` (protegida con sesión verificada) vía `useServerFn` + `useMutation`, y ya muestra "Conectando…", mensaje de éxito y errores inline. Esa parte del pedido está cumplida; solo se pulirá un detalle.
- Lo que **falta** es el tiempo real: consulté la publicación de realtime de la base de datos y **no tiene ninguna tabla**, así que hoy `whatsapp_connections` no emite cambios y la card no puede reaccionar a `connected` sin recargar.

## 1. Base de datos

Migración para habilitar realtime en la tabla:

```sql
ALTER TABLE public.whatsapp_connections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_connections;
```

Sin cambios de esquema, de RLS ni de permisos: el usuario ya tiene solo `SELECT` de su propia fila, y realtime respeta esa policy (cada cliente recibe únicamente su fila).

## 2. Suscripción en tiempo real

Nuevo hook `src/hooks/use-whatsapp-connection-realtime.ts`:

- Usa **el mismo cliente autenticado existente**: `import { supabase } from "@/integrations/supabase/client"` — la misma instancia (singleton) que ya usan las queries del dashboard, con la sesión del usuario persistida. No se crea ninguna instancia nueva ni se pasa una key aparte; así el socket de Realtime va autenticado y RLS filtra los eventos a la fila del usuario.
- Dentro de `useEffect`, crea un canal por usuario (`whatsapp-connection-${userId}`) escuchando `postgres_changes` con `event: "*"`, `schema: "public"`, `table: "whatsapp_connections"`, `filter: user_id=eq.${userId}`.
- En cada evento, invalida la consulta `["dashboard", userId]` para que el dashboard vuelva a leer el estado.
- Limpieza con `supabase.removeChannel(channel)` al desmontar y cuando cambia `userId` (evita suscripciones duplicadas y reconexiones en bucle).

Se monta en el dashboard (no dentro de la card), porque la card se desmonta justo cuando el status pasa a `connected`; si la suscripción viviera dentro de ella, el propio evento la mataría y podría perderse la actualización.

## 3. UI

- Cuando el status llega a `connected`, la card de onboarding desaparece automáticamente (ya es condicional) y `SubscriptionOverview` refleja el estado actualizado, sin recargar.
- Mientras el status es `pending` tras un envío exitoso, la card muestra un aviso de "Estamos verificando tu conexión…" con indicador, en lugar del formulario editable, para que el usuario no reenvíe los mismos datos.
- Si el status es `error`, la card muestra el formulario de nuevo con un aviso de que la conexión falló y hay que revisar las credenciales.
- Al conectarse correctamente se muestra un toast de confirmación ("WhatsApp conectado").

## Detalles técnicos

- Se pasa `whatsappStatus` como prop a `WhatsAppOnboardingCard` (viene ya del `fetchDashboard` existente).
- Sin cambios en `whatsapp.functions.ts` ni en `onboarding.server.ts`: el backend de Python sigue siendo el único que escribe en `whatsapp_connections`.
- Sin nuevos secretos ni dependencias.
