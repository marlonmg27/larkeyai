# Reorganizar la lógica de pagos en un módulo de servidor aislado

## Situación actual (verificada)

La lógica de Stripe ya vive del lado del servidor de este mismo sitio, en `src/lib/stripe/` (866 líneas en total), y solo se alcanza desde tres puntos:

- `src/lib/billing.functions.ts` — las acciones que llama la interfaz (checkout de plan, checkout de paquete, cancelar, reanudar, cambiar de plan, listar facturas).
- `src/routes/api/public/stripe/webhook.ts` — el punto donde Stripe entrega los eventos; verifica la firma y aplica los cambios locales.
- Tres componentes del panel (`PlansShowcase`, `PacksSection`, `SubscriptionActions`) que solo importan `billing.functions`, nunca los archivos internos.

En esta plataforma ya no se pueden crear "Edge Functions" nuevas, así que la mejora se hace dentro del sitio: mismo comportamiento, mejor separación.

## Qué se va a hacer

### 1. Una sola puerta de entrada

Se crea `src/lib/stripe/index.server.ts` como única fachada del módulo: expone las operaciones de negocio (crear checkout de suscripción, crear checkout de paquete, cancelar, reanudar, cambiar plan, listar facturas, procesar evento de Stripe). A partir de ahí:

- `billing.functions.ts` importa solo esa fachada, no seis archivos distintos.
- La ruta del webhook importa solo esa fachada.

Nada fuera del módulo vuelve a conocer su estructura interna.

### 2. Separar responsabilidades dentro del módulo

- `client.server.ts` — conexión con Stripe (sin cambios).
- `customers.server.ts` — clientes de Stripe (sin cambios).
- `checkout.server.ts`, `subscriptions.server.ts` — operaciones de negocio; se les quita la lectura directa de configuración, que pasa a un único `config.server.ts` (URL pública del sitio, secretos del backend, secreto del webhook), todo leído en tiempo de ejecución.
- `webhook.server.ts` (296 líneas) se divide en tres piezas: verificación de firma + registro del evento, aplicación del estado local, y reenvío al backend. Hoy están mezcladas en un solo archivo.
- `invoices.server.ts` — se mueve aquí la consulta de facturas que hoy está escrita dentro de `billing.functions.ts`, para que ese archivo quede como puro enlace entre interfaz y servidor.

### 3. Contratos y documentación

- `contracts.ts` se mantiene como el único lugar con los tipos compartidos, y se añaden los tipos de entrada/salida de cada operación de la fachada.
- Se actualiza `src/lib/stripe/README.md` con el mapa nuevo: qué archivo hace qué, y qué habría que reemplazar si algún día esta lógica se mueve al backend de Python.

## Lo que NO cambia

- Ninguna pantalla, texto ni botón del panel.
- La URL del webhook en Stripe sigue siendo la misma y este sitio sigue verificando la firma y reenviando los eventos al backend, tal como hoy.
- Sin cambios de base de datos, permisos ni precios.
- Los nombres que consume la interfaz (`createSubscriptionCheckout`, `createPackCheckout`, `cancelSubscription`, `resumeSubscription`, `changePlan`, `listInvoices`) se conservan idénticos.

## Verificación

Revisión de tipos completa y prueba manual en la vista previa: cargar el panel, abrir un checkout de plan y uno de paquete, y comprobar que el webhook responde 200 con una firma válida.
