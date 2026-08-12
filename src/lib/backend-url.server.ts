/**
 * Normalización compartida de `BACKEND_URL` (server-only).
 *
 * El valor lo edita una persona en el formulario de secretos, así que puede
 * llegar con espacios, comillas envolventes, barra final o incluso sin
 * esquema (`mi-app.up.railway.app`). Aquí lo dejamos como una URL absoluta
 * HTTPS utilizable, sin registrar nunca el valor completo en los logs.
 */

export type BackendUrlResult =
  | { ok: true; base: string; host: string }
  | { ok: false; reason: "missing" | "unparseable" | "not_https"; detail: Record<string, unknown> };

export function resolveBackendBaseUrl(raw: string | undefined | null): BackendUrlResult {
  if (!raw || raw.trim().length === 0) {
    return { ok: false, reason: "missing", detail: {} };
  }

  let value = raw.trim().replace(/^['"]+|['"]+$/g, "").trim();
  const hadScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  if (!hadScheme) value = `https://${value}`;
  value = value.replace(/\/+$/, "");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Nunca registramos el valor: solo pistas de forma.
    return {
      ok: false,
      reason: "unparseable",
      detail: { length: raw.trim().length, had_scheme: hadScheme },
    };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "not_https", detail: { protocol: url.protocol, host: url.host } };
  }

  return { ok: true, base: `${url.origin}${url.pathname.replace(/\/+$/, "")}`, host: url.host };
}
