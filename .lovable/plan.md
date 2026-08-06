# Landing: planes reales, CTAs funcionales y plan Enterprise

Solo frontend. No se toca base de datos, Stripe backend ni server functions.

## 1. Hero (primera vista)

- "Quiero mi asistente": hace scroll suave a la sección `#precios`.
- "Iniciar sesión": navega a `/auth`.

## 2. Sección pública de Planes y precios

Se reemplaza el contenido hardcodeado con "TODO" por los planes reales de la base de datos, mostrados igual que en el dashboard:

- Mismo diseño y datos que `PlansShowcase` (Basic, Standard, Pro), con selector Mensual / Anual (-20%), precio en MXN, mensajes incluidos y lista de beneficios.
- Se extrae la tarjeta de plan a un componente compartido para que la landing y el dashboard muestren exactamente lo mismo, sin duplicar copy.
- Se elimina toda mención de "TODO".

Comportamiento de los botones en la landing:

- Sin sesión activa: elegir un plan lleva a `/auth` (iniciar sesión / registrarse). Se recuerda el plan elegido para retomarlo después del acceso.
- Con sesión activa: elegir un plan lleva al dashboard, donde se completa el checkout.

## 3. Plan Enterprise (personalizado)

- Se mantiene la cuarta tarjeta, renombrada de "Empresarial" a **Enterprise**, con precio "Personalizado".
- Su botón abre la app de correo del cliente (`mailto:marlonmolinag12@gmail.com`) con asunto y cuerpo prellenados.
- Enterprise siempre abre el correo, con o sin sesión — nunca va a `/auth` ni a Stripe.

## 4. Dashboard (con sesión)

- En la sección de planes, cada plan mantiene/usa su botón que inicia el checkout de Stripe del plan seleccionado (comportamiento ya existente, verificado y con estados de carga y error).
- Se agrega al final la tarjeta **Enterprise** con el mismo botón de contacto por correo.

## 5. Contacto (footer)

- Email cambia a `marlonmolinag12@gmail.com`.
- Se elimina el número de teléfono / enlace de WhatsApp.

## Detalles técnicos

- `src/components/landing/Hero.tsx`: botones envueltos en `<Link to="/auth">` y scroll a `#precios`.
- Nuevo `src/components/pricing/PlanCards.tsx` (o similar) con la lógica compartida de lectura de `plans` activos vía React Query + Supabase (solo lectura pública ya existente) y render de tarjetas; recibe un prop de acción por tarjeta (`checkout` en dashboard, `auth`/`mailto` en landing).
- `src/components/landing/Pricing.tsx` pasa a consumir ese componente; `src/components/dashboard/PlansShowcase.tsx` se refactoriza para reutilizarlo y añadir la tarjeta Enterprise.
- Se conserva el manejo de carga / error / "sin planes" actual.
- `src/components/landing/Footer.tsx`: actualización de contacto.
