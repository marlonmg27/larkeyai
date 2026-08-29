# Renombrar `phone_display` → `phone_number` + nueva página privada "Instrucciones"

## 1. Alinear el código con el nuevo nombre de columna

La base de datos ya usa `phone_number` en `whatsapp_connections` (confirmado en los tipos generados). Quedan referencias al nombre viejo en:

- `src/lib/whatsapp/connections.server.ts` — el esquema de validación y la construcción de la fila de los endpoints puente (`upsert` y `status`) siguen escribiendo `phone_display`, así que hoy fallarían al escribir en la tabla.
- `src/lib/whatsapp/README.md` y `src/lib/database/README.md` — documentación del contrato para el backend de Python.

Cambio: usar `phone_number` como campo persistido. Para no romper el payload actual del backend, se aceptará `phone_number` y, si no viene, se leerá `phone_display` como alias de compatibilidad, mapeándolo siempre a la columna `phone_number`. La documentación se actualiza indicando `phone_number` como nombre oficial.

## 2. Nueva ruta privada `/instrucciones`

Página protegida (dentro del layout autenticado, igual que el dashboard, `noindex`) con:

- Un área de texto grande para las instrucciones del agente.
- Un botón "Guardar" (deshabilitado si no hay cambios o mientras guarda).
- Estados de carga, error y confirmación con toast.
- Enlace en el menú lateral, visible solo con sesión iniciada (junto a "Panel").

Flujo:

1. Al entrar, se obtiene el `phone_number` de la conexión de WhatsApp del usuario desde la base de datos.
2. Si el usuario aún no tiene canal conectado, se muestra un aviso con enlace al panel para conectarlo (no se llama al backend).
3. Con `phone_number` disponible, se consultan las instrucciones actuales al backend y se cargan en el área de texto.
4. Al guardar, se envían las instrucciones al backend y se refresca el valor mostrado.

## Detalles técnicos

- Ruta: `src/routes/_authenticated/instrucciones.tsx` (privada, sin variantes `/es` `/en`, igual que `/dashboard`).
- Nuevo módulo server-only `src/lib/agents/instructions.server.ts`:
  - `getInstructions(phoneNumber)` → `GET ${BACKEND_URL}/agents/instructions/{phone_number}`
  - `saveInstructions({ phoneNumber, instructions, userId })` → `PATCH ${BACKEND_URL}/agents/instructions/` con body `{ phone_number, instructions, user_id }`
  - Ambos con header `X-Internal-Secret`, `resolveBackendBaseUrl`, timeout de 15 s y mensajes de error legibles sin filtrar secretos.
- Nuevo `src/lib/agents/instructions.functions.ts` con dos `createServerFn` (`.middleware([requireSupabaseAuth])`):
  - `fetchAgentInstructions`: resuelve el `phone_number` del usuario vía `context.supabase` desde `whatsapp_connections` (RLS) y devuelve `{ phoneNumber, instructions }`.
  - `updateAgentInstructions`: valida con Zod (texto de hasta ~8000 caracteres), vuelve a resolver el `phone_number` en el servidor y usa `context.userId` como `user_id`. Nunca se confía en valores del cliente para identidad.
- Datos en el componente con `useQuery` / `useMutation` vía `useServerFn` (no en el loader, por ser funciones protegidas).
- Textos en español, siguiendo el estilo actual del panel; UI con `Card`, `Textarea` y `Button` existentes.
- Sin cambios en pagos, autenticación ni el flujo de conexión de WhatsApp.
