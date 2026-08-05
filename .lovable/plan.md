# Card de onboarding de WhatsApp en el dashboard

## 1. Permisos de lectura en whatsapp_connections (verificado)

Revisé la base de datos:

- La policy de lectura **ya existe**: `SELECT` para `authenticated` con `auth.uid() = user_id`. No hace falta agregarla.
- **Pero la tabla no tiene ningún permiso concedido** (cero GRANTs). Sin eso, la consulta desde el cliente falla con error de permisos, así que el síntoma que describes es real, solo que la causa es el GRANT ausente, no la policy.

Migración necesaria:

```sql
GRANT SELECT ON public.whatsapp_connections TO authenticated;
GRANT ALL ON public.whatsapp_connections TO service_role;
```

Solo lectura para el usuario; escritura reservada al backend con service role, como se definió.

## 2. Manejo de error aislado en fetchDashboard

En `src/routes/_authenticated/dashboard.tsx`:

- La consulta a `whatsapp_connections` se hace por separado, envuelta en su propio try/catch (o `.then().catch()` dentro del `Promise.all`), y su error nunca se propaga.
- Si falla (permisos, red, timeout): `console.error` con el motivo y `whatsapp: null` en `DashboardData`; el resto del dashboard carga normal.
- `DashboardData` gana `whatsapp: { status: string } | null`.

## 3. WhatsAppOnboardingCard

Nuevo componente `src/components/dashboard/WhatsAppOnboardingCard.tsx`.

Se muestra solo si **ambas** condiciones se cumplen:

- `subscription_status` está en `active` o `trialing`.
- `whatsapp.status` es distinto de `connected`, o no hay fila (`whatsapp === null`).

Contenido: título "Conecta tu WhatsApp" + descripción corta en español, y formulario con:

- Nombre a mostrar del negocio (texto)
- Phone number ID (texto)
- WABA ID — WhatsApp Business Account ID (texto)
- Access token (tipo password, con botón de mostrar/ocultar)

Validación con zod (requeridos, trim, longitudes máximas) y errores inline. Botón "Guardar conexión" solo hace `console.log`, con el access token **enmascarado** (longitud + últimos 4 caracteres), nunca en texto plano.

Se renderiza en la vista de cliente activo, arriba de la sección de packs. Sin escrituras a la base de datos todavía.
