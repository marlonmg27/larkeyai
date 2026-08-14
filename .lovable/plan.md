# Menú lateral con páginas propias

Añadir un menú lateral persistente con cinco secciones, cada una con su propia URL (no anclas en la misma página).

## Menú y rutas

| Opción | Ruta | Contenido |
| --- | --- | --- |
| Inicio | `/` | La landing pública actual (hero, cómo funciona, precios, FAQ) |
| Dashboard | `/dashboard` | El panel autenticado actual (solo visible con sesión) |
| Precios | `/precios` | Cards de planes de suscripción + paquetes de mensajes |
| Contacto | `/contacto` | Bloque de contacto (email marlonmolinag12@gmail.com) |
| FAQ | `/faq` | Las preguntas frecuentes existentes |

Comportamiento:
- El menú lateral aparece en todas las páginas (pública y autenticada), colapsable con un botón siempre visible; en móvil se abre como panel deslizable.
- Con sesión iniciada: se ven las cinco opciones, más un botón de cerrar sesión.
- Sin sesión: se ocultan Dashboard y se muestran accesos a "Iniciar sesión".
- La opción activa se resalta según la URL actual.

## Páginas nuevas

- **Precios**: reutiliza `PlanCards` (suscripciones) y añade los paquetes de mensajes. Los botones llevan a `/auth` si no hay sesión, o a checkout/dashboard si la hay, igual que hoy en la landing.
- **Contacto**: título, texto breve, email como enlace `mailto:` y una nota de que si aún no tienen WhatsApp Business Account o Meta App pueden escribir.
- **FAQ**: el acordeón existente, reutilizando la misma lista de preguntas.
- La landing en `/` conserva sus secciones de precios y FAQ; las nuevas páginas son versiones dedicadas y enlazables.

## Detalles técnicos

- Nuevas rutas: `src/routes/precios.tsx`, `src/routes/contacto.tsx`, `src/routes/faq.tsx`, cada una con su propio `head()` (title, description, og:title, og:description, canonical).
- Layout: nuevo `src/components/layout/AppSidebar.tsx` + `SiteShell.tsx` usando `SidebarProvider`/`Sidebar` de shadcn, con `SidebarTrigger` en un header fijo. Se envuelve en `src/routes/__root.tsx` alrededor de `<Outlet />` (excluyendo las rutas `/api/*`, que no renderizan UI).
- Visibilidad de Dashboard: se decide con `useAuth()`; la protección real sigue en el guard `_authenticated`.
- Extraer el contenido de precios/paquetes/FAQ/contacto a componentes reutilizables para que landing y páginas dedicadas compartan el mismo código (sin duplicar textos).
- Añadir `/precios`, `/contacto` y `/faq` a `src/routes/sitemap[.]xml.ts`.
- Sin cambios de base de datos ni de lógica de facturación.
