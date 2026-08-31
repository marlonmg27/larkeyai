# Paso 1 sin contraseña: solo correo

El paso 1 del onboarding deja de pedir contraseña. La cuenta se crea siempre con la contraseña fija `Default123!`, que se le muestra al usuario únicamente cuando ya tiene su `chatwoot_user_id` en la tabla `users` (es decir, cuando el paso 1 quedó completado).

## Formulario del paso 1

- Un solo campo: **Correo electrónico**, y un botón **Enviar**.
- Se eliminan los campos de contraseña y confirmación, junto con el ojo de mostrar/ocultar.
- El servidor envía `POST /onboarding` con solo `user_id` y `email`. La contraseña ya no viaja del frontend al backend: `Default123!` está definida en el backend. En el frontend la constante se conserva únicamente como texto informativo para mostrarle al usuario cómo entrar.

## Texto del paso 1 (antes de enviar)

Tono amigable, sin inventar funciones de la plataforma más allá de lo ya mencionado:

- Título: "Antes de continuar, creemos tu cuenta"
- Descripción: explicar que con su correo le abrimos su cuenta en la plataforma de conversaciones, y que desde ahí podrá:
  - ver todas sus conversaciones de WhatsApp en un solo lugar,
  - tomar el control de un chat cuando quiera responder en persona,
  - invitar a su equipo y darles acceso,
  - asignar conversaciones a la persona correcta.
- Cierre: "Ingresa tu correo y da clic en enviar; te avisamos en cuanto esté lista."

## Estado completado del paso 1

Cuando `users.chatwoot_user_id` ya existe, la tarjeta muestra el paso como completado y ahí sí revela las credenciales de acceso: el correo usado y la contraseña temporal `Default123!`, con la recomendación de cambiarla al entrar (mismo mensaje que hoy ya aparece en la guía de acceso).

## Detalles técnicos

- `src/lib/chatwoot/schema.ts`: el esquema queda solo con `email`; se quitan `password` y `confirmPassword`.
- `src/lib/chatwoot/account.functions.ts`: solo pasa `userId` y `email`; no hay contraseña en ningún punto de la cadena.
- `src/lib/chatwoot/account.server.ts`: se quita `password` del tipo de entrada y del body enviado al backend.
- `src/components/dashboard/ChatwootAccountCard.tsx`: formulario de un solo campo, textos nuevos, y en el estado `hasAccount` se muestran correo + contraseña temporal con nota de cambiarla.
- Sin cambios en base de datos ni en el paso 2.
