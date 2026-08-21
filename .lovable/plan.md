# Página /guia con la guía de Meta

Objetivo: dar a la guía de generación de token de Meta su propia página, accesible desde el menú lateral solo para usuarios con sesión iniciada.

## Qué se construye

1. **Nueva ruta protegida `/guia`**
   - Archivo `src/routes/_authenticated/guia.tsx` (URL final: `/guia`), dentro del layout autenticado existente, que ya redirige a `/auth` si no hay sesión.
   - Contenido: título, breve introducción y el componente `MetaTokenGuide` reutilizado tal cual (sin el botón "Ya tengo mi token, continuar", que solo aplica dentro del flujo del dashboard).
   - Botón al final: "Ir al Dashboard" para conectar el canal.
   - `head()` propio con título/descripción y `robots: noindex` (página privada).

2. **Acceso en el menú lateral**
   - Agregar la opción "Guía" (icono de libro) en `AppSidebar.tsx` con `authOnly: true`, ubicada después de Dashboard.

3. **Sitemap**
   - No se agrega `/guia` al sitemap: es privada, igual que `/dashboard`.

## Nota

No se modifica el flujo actual del dashboard: la guía sigue apareciendo dentro de la card de conexión de WhatsApp. La página `/guia` es un acceso adicional para releerla en cualquier momento.
