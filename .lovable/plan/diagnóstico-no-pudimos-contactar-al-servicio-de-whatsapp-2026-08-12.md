# Diagnóstico: "No pudimos contactar al servicio de WhatsApp"

## Qué está pasando (confirmado en logs)

Ese mensaje no viene de Meta ni de la Graph API: lo lanza `src/lib/whatsapp/onboarding.server.ts` cuando el `fetch` hacia tu backend FastAPI falla antes de recibir respuesta. Los logs publicados lo muestran tres veces en los últimos minutos, todas del mismo usuario:

```text
[whatsapp-onboarding] fetch falló {"user_id":"9a7a...","reason":"TypeError"}
```

`reason: "TypeError"` (no `TimeoutError`) significa que la conexión ni se estableció: URL inválida, host que no resuelve, esquema no permitido (`http://`/`localhost` no son alcanzables desde el runtime publicado) o túnel/servidor caído. El secreto `BACKEND_URL` existe, pero su valor no es alcanzable desde el servidor.

Nota: la validación con la Graph API sí se ejecutó antes y pasó; el fallo ocurre en el paso siguiente, el reenvío a `${BACKEND_URL}/onboarding/whatsapp`.

## Cambios propuestos

1. En `src/lib/whatsapp/onboarding.server.ts`, mejorar el diagnóstico sin filtrar secretos:
   - Validar `BACKEND_URL` con `new URL()` al inicio; si no parsea o el protocolo no es `https:`, registrar el motivo exacto y devolver un mensaje claro de "no configurado".
   - En el `catch` del fetch, registrar además el `host` destino y `err.message` (nunca el token ni el internal secret).

2. Añadir un chequeo de alcance rápido (solo logging) que distinga en los logs entre "host no resuelve", "conexión rechazada" y "respuesta no-2xx", para no volver a depender de un `TypeError` genérico.

3. Verificación:
   - Reintentar el formulario y confirmar en los logs publicados que aparece el host y el motivo concreto.
   - Si el host es un túnel local (`ngrok`, `localhost`, IP privada) o `http://`, actualizar `BACKEND_URL` a la URL pública HTTPS del FastAPI; ese es el arreglo real.

## Alcance técnico

Sin cambios de esquema ni de frontend. El fix definitivo depende del valor de `BACKEND_URL`: si tu FastAPI no está expuesto en una URL pública HTTPS, el runtime publicado nunca podrá alcanzarlo. Los cambios de código solo hacen visible la causa en los logs.
