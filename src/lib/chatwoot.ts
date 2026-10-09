/**
 * Configuración pública de la plataforma de conversaciones (Chatwoot self hosted).
 */
const env = import.meta.env as Record<string, string | undefined>;

/** URL de producción (Railway); respaldo si `VITE_CHATWOOT_FRONTEND_URL` no está definida o viene vacía. */
const DEFAULT_CHATWOOT_FRONTEND_URL = "https://chatwoot-production-3b40.up.railway.app";

function resolveChatwootFrontendUrl(): string {
  const raw = env["VITE_CHATWOOT_FRONTEND_URL"]?.trim();
  return (raw || DEFAULT_CHATWOOT_FRONTEND_URL).replace(/\/+$/, "");
}

/** URL base del frontend de Chatwoot, sin slash final. Se configura con `VITE_CHATWOOT_FRONTEND_URL`. */
export const CHATWOOT_FRONTEND_URL = resolveChatwootFrontendUrl();

/** Login de la plataforma. */
export const CHATWOOT_LOGIN_URL = `${CHATWOOT_FRONTEND_URL}/app/login`;

/** Contraseña temporal con la que el backend crea la cuenta del cliente. */
export const CHATWOOT_DEFAULT_PASSWORD = "Default123!";
