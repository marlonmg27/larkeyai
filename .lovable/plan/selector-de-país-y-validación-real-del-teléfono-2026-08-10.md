# Selector de país y validación real del teléfono

Cambio solo de frontend en la card "Conecta tu canal de mensajería".

## 1. Selector de código de país

El campo "Phone number" se divide en dos controles lado a lado:

- Un selector (buscable, con bandera + nombre + código, p. ej. "🇲🇽 México +52") con México preseleccionado por defecto.
- El input del número local, sin el prefijo.

Lista de países incluida en el frontend (código ISO, nombre en español, prefijo, largo esperado de dígitos nacionales). Se incluye una lista amplia de LatAm, EE. UU./Canadá y Europa principal, con México primero.

## 2. Validación del número

Al escribir se limpia todo lo que no sea dígito o espacio. La validación exige:

- Número requerido.
- Solo dígitos (espacios/guiones/paréntesis se aceptan al escribir pero se normalizan).
- Largo de dígitos nacionales válido para el país elegido (rango mínimo/máximo por país; 10 dígitos exactos para México, EE. UU. y Canadá).
- Mensajes en español, inline bajo el campo, p. ej. "El número de México debe tener 10 dígitos".

Debajo del campo se muestra en gris el número final normalizado en formato E.164 (`+526621234567`) para que el usuario confirme lo que se va a enviar.

## 3. Qué se envía al backend

El payload no cambia de forma: `phone_number` sigue siendo una sola cadena, pero ahora siempre normalizada en E.164 (`+` + prefijo + dígitos nacionales, sin espacios). Se añade validación equivalente en el esquema compartido, así que el servidor rechaza cualquier valor que no sea E.164 válido.

## Detalles técnicos

- Nuevo `src/lib/phone/countries.ts`: lista de países (`iso`, `name`, `dialCode`, `flag`, `minDigits`, `maxDigits`) + helpers `toE164`, `digitsOnly`, `findCountryByIso`.
- `src/lib/whatsapp/schema.ts`: `phoneNumber` pasa a validarse con regex E.164 (`/^\+[1-9]\d{7,14}$/`) y máximo 16 caracteres. Sin otros cambios de campos.
- Nuevo `src/components/dashboard/PhoneField.tsx`: selector (shadcn `Popover` + `Command` para búsqueda, ya disponibles) + `Input`; expone `value` E.164 y errores de validación por país al padre.
- `src/components/dashboard/WhatsAppOnboardingCard.tsx`: usa `PhoneField` en lugar del `Input` de teléfono; mantiene estado de país + dígitos locales y compone el E.164 antes de `schema.safeParse`.
- Sin cambios de base de datos, de la server function ni del contrato de claves del payload. Se actualiza `src/lib/whatsapp/README.md` indicando que `phone_number` llega en E.164.
