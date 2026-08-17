# La guía de Chatwoot no apareció: qué encontré y qué haré

## Lo que verifiqué en la base de datos

Para `jira@gmail.com`:

- Suscripción: `active`, plan Basic, activada a las 20:32:34 UTC.
- Fila en `whatsapp_connections`: existe, `status = connected`, teléfono `+526623286156`, actualizada 20:36:59 UTC.
- Permisos y RLS de `whatsapp_connections`: correctos (lectura propia para usuario autenticado).
- Realtime: la tabla sí está publicada.

Es decir: los datos están bien y la card de acceso a Chatwoot **debería** haberse mostrado. La condición del dashboard (`suscripción activa` + `existe fila`) se cumple hoy.

Lo que sí aparece en el registro del preview a las 20:33 (mientras estabas en el dashboard) es un error de carga de módulo del framework (`createIsomorphicFn`). Ese error rompe el render de la parte del dashboard que depende de funciones de servidor, y explica que tras enviar el formulario no se refrescara la vista ni apareciera la guía. No es un cambio de lógica que haya hecho: es una carga fallida en el preview, pero el dashboard no tiene defensa contra ella y por eso lo viviste como "el bug volvió".

## Qué haré (solo frontend)

1. **Reproducir con tu sesión** en el preview autenticado y confirmar si la card de Chatwoot aparece hoy tras recargar; capturar el error de módulo si vuelve.
2. **Dejar de tragarse los errores de lectura**: hoy `fetchWhatsappConnection` atrapa cualquier error y devuelve `null`, lo que hace que la guía desaparezca en silencio. Pasará a distinguir "no hay fila" de "falló la lectura", y en el segundo caso mostrará un aviso con botón de reintento en lugar de nada.
3. **Mostrar el acceso a Chatwoot siempre que exista fila de conexión**, sin depender de que la suscripción esté activa en ese instante (una conexión ya creada nunca debe quedar sin puerta de entrada).
4. **Refresco robusto sin depender solo de Realtime**: refetch al volver el foco a la pestaña y un sondeo suave mientras el status no sea `connected`, para que el cambio hecho por tu backend se refleje aunque el socket falle.
5. **Blindar el render**: envolver la sección de conexión/Chatwoot en un límite de error local, para que una carga fallida de módulo o una excepción de un hijo no borre la card entera; mostrará "recargar" en su lugar.
6. Verificación final en el preview con la cuenta `jira@gmail.com`: recargar, confirmar que la card con credenciales y el botón "Entrar a mi plataforma de conversaciones" está visible con `status = connected`.

## Detalles técnicos

- `src/routes/_authenticated/dashboard.tsx`: `fetchWhatsappConnection` devuelve `{ status } | null | { error }`; `showChatwootAccess = data?.whatsapp != null`; opciones de `useQuery` con `refetchOnWindowFocus: true` y `refetchInterval` condicional mientras el status sea distinto de `connected`.
- `src/components/dashboard/ChatwootAccessCard.tsx`: acepta el caso "no pudimos leer tu conexión" y renderiza el aviso de reintento.
- Nuevo límite de error ligero reutilizable para la sección (componente local, sin dependencias nuevas).
- Sin cambios en base de datos, RLS, server functions ni contratos con el backend de Python.
