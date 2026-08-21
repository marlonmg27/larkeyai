# Guía de Meta antes de conectar WhatsApp

Antes de que el usuario vea el formulario de conexión, se le muestra una guía paso a paso para obtener su token en Meta Business Suite.

## Flujo

1. En el dashboard, al elegir el canal **WhatsApp** ya no aparece el formulario directamente: primero se muestra la guía.
2. La guía lista los pasos numerados:
   - Entrar a Meta Business Suite → **Configuración** → **Apps** → **Agregar**.
   - Click en **Solicitar acceso** e ingresar el ID de la app de Larkey: `871512495342882` (con botón de copiar).
   - Crear un **usuario del sistema** de tipo **admin**.
   - Click en **Conectar activos**: seleccionar la app Larkey y la cuenta WABA que desea usar, y otorgar permisos.
   - Click en **Generar token** → seleccionar la app Larkey.
   - Seleccionar los permisos `whatsapp_business_management` y `whatsapp_business_messaging` (con botón de copiar).
   - Usar ese token en el campo **Api Key** del formulario.
3. Al final, un botón **"Ya tengo mi token, continuar"** revela el formulario actual (sin cambios en sus campos ni en su envío).
4. También queda un enlace/acordeón **"Ver la guía otra vez"** sobre el formulario, para que el usuario pueda releerla sin perder lo que ya escribió.
5. Se conserva el botón de volver al listado de canales y el bloque de conexión rápida (Embedded Signup) tal como está hoy.

## Detalles técnicos

- Nuevo componente `src/components/dashboard/MetaTokenGuide.tsx` (presentacional): pasos numerados, campos copiables para el App ID y los permisos, y callback `onContinue`.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: nuevo estado local `guideDone` (por canal); mientras sea `false` se renderiza la guía en lugar del formulario. El acordeón "Ver la guía otra vez" reutiliza el mismo componente con `Collapsible`.
- El App ID se toma de la constante ya existente en `src/lib/whatsapp/embedded-signup.ts` en vez de duplicar el número.
- Sin cambios en el esquema Zod, en las server functions, en la base de datos ni en la validación con la Graph API.
