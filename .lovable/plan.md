# Diagnóstico: "La conexión con el servicio de WhatsApp no está configurada todavía"

## Qué cambió (confirmado en logs publicados)

El mensaje de la captura ya NO es el de antes. Ahora el log es:

```text
[2026-08-12T07:03:01Z] [error] [whatsapp-onboarding] BACKEND_URL no es una URL válida
```

Antes (06:42–07:01) el fallo era `fetch falló {"reason":"TypeError"}`, es decir la URL parseaba pero el host no era alcanzable. Después de eso el valor de `BACKEND_URL` se editó y quedó con un formato que `new URL()` no puede parsear — típicamente falta el esquema (`mi-backend.ngrok-free.app` en vez de `https://mi-backend.ngrok-free.app`), o se guardó con espacios / comillas / un comando pegado por error.

El secreto existe (aparece en la lista), pero su valor no es una URL absoluta válida, así que la validación agregada en `src/lib/whatsapp/onboarding.server.ts` corta antes de intentar la conexión.

## Arreglo

1. **Corregir el valor del secreto `BACKEND_URL`** (esto es el arreglo real). Sí: el correcto es el **público** de Railway, con esquema y sin barra final:

   ```text
   https://larkey-production.up.railway.app
   ```

   El privado (`larkey.railway.internal`) solo resuelve dentro de la red de Railway; desde el runtime publicado de Lovable no es alcanzable. Lo dejo guardado con ese valor.

2. **Hacer el parseo tolerante** en `src/lib/whatsapp/onboarding.server.ts`:
   - Normalizar el valor: recortar espacios y quitar comillas envolventes.
   - Si el valor no trae esquema, asumir `https://` antes de parsear.
   - Si tras eso sigue sin parsear, registrar en el log el largo del valor y si contenía esquema (nunca el valor completo) para diagnosticar sin filtrar el secreto.

3. **Mismo tratamiento en `src/lib/stripe/backend-forward.server.ts`**, que arma la URL con concatenación de texto sin validar; usará el mismo helper de normalización para no fallar en silencio en el reenvío de eventos de Stripe.

4. **Verificación**: reintentar el formulario y confirmar en los logs publicados que ya no aparece "no es una URL válida" y que, si algo falla, el log muestre el host y el status concreto del backend.

## Alcance técnico

Sin cambios de esquema ni de UI. Se agrega un helper compartido de normalización de `BACKEND_URL` y se usa en los dos puntos que lo consumen. El éxito final depende de que tu FastAPI esté publicado en una URL pública HTTPS alcanzable desde el runtime.
