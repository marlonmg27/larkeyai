# Sitio bilingüe español / inglés con SEO correcto

## Qué se va a construir

Cada página pública tendrá dos versiones reales, renderizadas en el servidor (no un toggle de JavaScript):

- Español bajo `/es/...`
- Inglés bajo `/en/...`

Cada versión tiene su propio `title`, meta description, H1, `lang`, canonical autorreferente y hreflang recíproco (`es`, `en`, `x-default`). Nada de los dos idiomas mezclados en la misma pantalla.

No se toca el dashboard, la autenticación, Stripe, los formularios de WhatsApp ni ninguna lógica de negocio: solo se traducen las etiquetas visibles.

## Tabla de rutas propuesta

| Ruta | Title | Meta description | H1 | Idioma | URL alternativa |
|---|---|---|---|---|---|
| `/es/` | Larkey — Asistentes de IA que responden tu WhatsApp | Larkey crea asistentes conversacionales que atienden tu WhatsApp y otros canales 24/7. Tú supervisas, el asistente responde. | Libérate de responder mensajes. Larkey lo hace por ti. | es | `/en/` |
| `/en/` | Larkey — AI WhatsApp Agents for Business | Larkey builds AI agents that answer your business WhatsApp 24/7, qualify leads and book appointments while you stay in control. | Stop answering every message. Let your AI agent do it. | en | `/es/` |
| `/es/precios` | Precios y planes — Larkey | Planes de suscripción de Larkey y paquetes de mensajes adicionales. Pagas por mensajes reales, sin permanencia y con 14 días de prueba. | Precios y planes | es | `/en/pricing` |
| `/en/pricing` | Pricing & Plans — Larkey WhatsApp AI Agents | Compare Larkey plans and message packs. Pay per real message, no lock-in, 14-day free trial on every subscription. | Pricing and plans | en | `/es/precios` |
| `/es/faq` | Preguntas frecuentes — Larkey | Respuestas sobre cómo funciona el asistente de WhatsApp, canales disponibles, personalización y cómo se cuentan los mensajes. | Preguntas frecuentes | es | `/en/faq` |
| `/en/faq` | FAQ — How Larkey WhatsApp AI Agents Work | Answers about how the WhatsApp AI agent works, supported channels, customization and how message usage is counted. | Frequently asked questions | en | `/es/faq` |
| `/es/contacto` | Contacto — Larkey | Escríbenos para activar tu asistente de WhatsApp, pedir una cotización Enterprise o resolver dudas sobre tu WhatsApp Business Account. | Contacto | es | `/en/contact` |
| `/en/contact` | Contact Larkey — Talk to Our Team | Get in touch to launch your WhatsApp AI agent, request an Enterprise quote or get help with your WhatsApp Business Account. | Contact us | en | `/es/contacto` |
| `/es/guia` | Guía para conectar WhatsApp — Larkey | Pasos para generar tu token de acceso en Meta Business Suite y conectar tu WhatsApp Business con Larkey. | Guía para conectar tu WhatsApp | es | `/en/whatsapp-setup-guide` |
| `/en/whatsapp-setup-guide` | WhatsApp Business API Setup Guide — Larkey | Step-by-step guide to create your Meta system user, grant permissions and generate the access token Larkey needs. | How to connect your WhatsApp Business account | en | `/es/guia` |
| `/es/acceso` | Iniciar sesión — Larkey | Inicia sesión en Larkey o crea tu cuenta para activar tu asistente, revisar tu consumo de mensajes y gestionar tu plan. | Acceso de clientes | es | `/en/login` |
| `/en/login` | Log in — Larkey Client Area | Log in to Larkey or create an account to activate your AI agent, track message usage and manage your subscription. | Client login | en | `/es/acceso` |
| `/es/legal/privacidad` | Aviso de privacidad — Larkey | Cómo Larkey recopila, usa y protege los datos de tu cuenta y de las conversaciones gestionadas por tu asistente. | Aviso de privacidad | es | `/en/legal/privacy` |
| `/en/legal/privacy` | Privacy Policy — Larkey | How Larkey collects, uses and protects your account data and the conversations handled by your AI agent. | Privacy policy | en | `/es/legal/privacidad` |
| `/es/legal/terminos` | Términos y condiciones — Larkey | Condiciones de uso del servicio Larkey: suscripciones, consumo de mensajes, cancelación y responsabilidades. | Términos y condiciones | es | `/en/legal/terms` |
| `/en/legal/terms` | Terms of Service — Larkey | Larkey terms of service: subscriptions, message usage, cancellation and responsibilities. | Terms of service | en | `/es/legal/terminos` |

Notas sobre las páginas legales: hoy no existen en el sitio. Se crean con un texto base claro y honesto (sin inventar cláusulas legales específicas ni datos fiscales); tú lo revisas y ajustas después.

## Rutas antiguas y raíz

- `/`, `/precios`, `/faq`, `/contacto`, `/guia`, `/auth` ya están indexadas. Se conservan como **redirecciones permanentes** a su equivalente `/es/...` para no perder posicionamiento (`/auth` → `/es/acceso`).
- `/` detecta el idioma del navegador y redirige a `/es/` o `/en/`. `x-default` apunta a la versión española.
- `/dashboard` sigue igual (privado, `noindex`): su interfaz se traduce según el idioma activo, pero no se duplica la URL.

## Detalles técnicos

- **Diccionarios**: `src/i18n/es.ts` y `src/i18n/en.ts` con todas las cadenas visibles (menú, botones, formularios, mensajes de error/toasts, footer, legales). Tipado con `keyof typeof es` para que falte cero traducción.
- **Contexto de idioma**: layouts `src/routes/es/route.tsx` y `src/routes/en/route.tsx` que exponen el locale por contexto de ruta; `useT()` lee de ahí (no de estado de cliente), así el HTML servido ya viene traducido.
- **Componentes**: `Header`, `Footer`, `Hero`, `HowItWorks`, `Pricing`/`PlanCards`, `FAQ`, `MetaTokenGuide`, `AppSidebar`, pantallas de auth y dashboard pasan a leer textos del diccionario en lugar de literales.
- **`lang`**: `RootShell` en `src/routes/__root.tsx` deja de tener `lang="en"` fijo y lo deriva del primer segmento de la URL.
- **head() por ruta**: cada leaf define `title`, `description`, `og:*`, `canonical` autorreferente y `links` con `hreflang="es"`, `hreflang="en"`, `hreflang="x-default"` recíprocos. JSON-LD (`Organization`, `WebSite`, `FAQPage`) se localiza con `inLanguage`.
- **Sitemap**: `src/routes/sitemap[.]xml.ts` lista las 16 URLs públicas con sus `xhtml:link` alternos; se quitan las rutas antiguas ya redirigidas.
- **Selector de idioma**: control ES/EN en el header y en el sidebar que enlaza a la URL equivalente exacta usando un mapa de rutas (`/es/guia` ↔ `/en/whatsapp-setup-guide`), no un simple cambio de prefijo.
- **Intacto**: `src/lib/stripe/*`, `src/lib/whatsapp/*`, server functions, rutas `api/public/*`, esquema de base de datos y flujos de pago/auth. Solo cambian textos y metadatos.
- **Verificación**: se abre la vista previa y se comprueba el HTML servido de `/es/` y `/en/` (title, `lang`, canonical, hreflang) sin ejecutar JavaScript.
