# SEO técnico: metadatos, datos estructurados y prerenderizado

## Aclaración importante antes de empezar

Este sitio **ya no es una SPA**: corre sobre TanStack Start con renderizado en el servidor, y el HTML que reciben Google y las redes sociales ya llega con título, descripción, canonical y hreflang por ruta (revisado en `src/i18n/seo.ts` y en las rutas de `/es` y `/en`).

Por eso **no se va a instalar `react-helmet-async`**: en este stack duplicaría las etiquetas y rompería el `<head>`. El mismo objetivo (metadatos únicos por página y por idioma) se cumple con el sistema `head()` que ya existe, y se completa donde falta. Si prefieres que lo instale igual, dímelo, pero el resultado sería peor para SEO.

## 1. Metadatos por ruta (ya presentes, se auditan y completan)

Se revisan las 16 rutas públicas (`/es`, `/es/precios`, `/es/faq`, `/es/contacto`, `/es/guia`, `/es/acceso`, legales, y sus equivalentes en `/en`) y se verifica que cada una tenga:

- título y descripción únicos y en su idioma
- canonical autorreferente y hreflang recíproco (es / en / x-default)
- Open Graph y Twitter completos (`og:locale` incluido)
- imagen de compartir en tamaño correcto (1200x630) en lugar de la captura genérica actual

## 2. Navegación rastreable

- Menú, footer, sidebar y CTAs ya usan enlaces reales; se auditan todos.
- Se corrige el único caso real de navegación por JavaScript: el botón principal del inicio ("ver precios") hoy hace scroll con `document.getElementById`. Pasa a ser un enlace real a `/es/precios` (o `/en/pricing`), con el mismo aspecto.
- Los `onClick` que quedan son acciones (cerrar sesión, elegir plan, cambiar mensual/anual), no navegación de contenido: se conservan.

## 3. Datos estructurados

- Inicio: `Organization` + `WebSite` (ya existe; se separa el `FAQPage` para no duplicarlo con la página de preguntas).
- Preguntas frecuentes: `FAQPage` por idioma.
- Precios: se añade `Product` con `OfferCatalog` y `Offer` por plan (precio real, moneda MXN, mensual/anual), localizado.
- Rutas internas: `BreadcrumbList` en páginas de segundo nivel.

## 4. Preparación para prerenderizado

- Se actualiza `@lovable.dev/vite-tanstack-config` de 2.13.1 a la versión que soporta prerenderizado (2.20.0+); con la actual la configuración se acepta pero no genera nada.
- En `vite.config.ts` se activa el prerenderizado listando explícitamente las 16 rutas públicas, con el descubrimiento automático desactivado para que `/dashboard` e `/instrucciones` (privadas) nunca se congelen en HTML.
- No se agrega `vite-ssg`: es de otro stack e incompatible aquí.
- Se protegen los accesos a `window` / `document` / `sessionStorage` que se ejecutan durante el render, para que la generación estática no falle.

## 5. Accesibilidad y encabezados

- Un solo `h1` por ruta, con `h2` y `h3` en orden; se corrige la página de precios y la de preguntas para que no repitan nivel.
- Se revisan todas las imágenes e iconos: `alt` descriptivo en las informativas y `alt=""` con `aria-hidden` en las decorativas (el mockup de WhatsApp y los iconos de la landing).

## Lo que no se toca

Pagos, autenticación, formularios de WhatsApp, endpoints del backend y esquema de base de datos quedan intactos: solo textos, metadatos, enlaces y configuración de build.

## Nota final

Los cambios de metadatos solo se ven en la URL pública después de publicar.
