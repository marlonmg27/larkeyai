# Solucionar rutas no indexadas en Google Search Console

## Diagnóstico (ya verificado en producción)

- Las 16 URLs públicas (`/es/*` y `/en/*`) responden **HTTP 200**, con `lang` correcto, canonical autorreferente y hreflang recíproco (`es`, `en`, `x-default`).
- El sitemap publicado lista las 16 URLs con sus alternos hreflang.
- Las rutas antiguas (`/`, `/precios`, `/faq`, `/contacto`, `/guia`, `/auth`) devuelven 301 a sus equivalentes nuevas.
- El homepage ya está "Enviada e indexada" según Search Console.

Conclusión: no hay un error técnico de indexación. Lo que Search Console muestra es casi con seguridad:

1. **"Página con redirección"** en las URLs antiguas → es el estado correcto y deseado, no un error.
2. **"Descubierta: actualmente sin indexar" / "Rastreada: actualmente sin indexar"** en las URLs `/es/*` y `/en/*` → tienen ~1 día de vida; Google tarda días o semanas en indexar páginas nuevas.
3. `/dashboard` no debe indexarse (requiere sesión y redirige) → correcto.

## Acciones

1. **Reenviar el sitemap** a Search Console (`PUT /webmasters/v3/sites/.../sitemaps/...`) para que Google reprocese las 16 URLs nuevas de inmediato.
2. **Inspeccionar las URLs clave** (`/es`, `/en`, `/es/precios`, `/en/pricing`) con la API de URL Inspection para leer su estado real en el índice y confirmar qué categoría reporta GSC.
3. **Corregir la redirección de trailing slash**: `/es/` → `/es` responde 307 (temporal); cambiar a 301 permanente si es configurable, para consolidar señales.
4. **Marcar el hallazgo SEO correspondiente** como corregido tras reenviar el sitemap.

## Lo que NO se puede automatizar (importante)

- La API de Search Console **no puede pedir indexación ni rastreo en vivo**. Si tras reenviar el sitemap las páginas siguen "sin indexar" después de 1-2 semanas, la acción manual es usar **Inspección de URL → "Solicitar indexación"** en la interfaz de Search Console.
- "Página con redirección" en las URLs viejas **no se debe arreglar**: es la señal de que el 301 funciona y transfiere el posicionamiento.

## Verificación

- Confirmar respuesta del reenvío del sitemap (sin errores).
- Leer el estado del sitemap en GSC tras el envío.
- Reportar el estado de indexación real de cada URL inspeccionada.
