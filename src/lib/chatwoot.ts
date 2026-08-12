/**
 * Configuración pública de la plataforma de conversaciones (Chatwoot self hosted).
 */
const env = import.meta.env as Record<string, string | undefined>;

/** URL base del frontend de Chatwoot. */
export const CHATWOOT_FRONTEND_URL =
  env["VITE_CHATWOOT_FRONTEND_URL"] ?? "https://chatwoot-production-3b40.up.railway.app";

/** Login de la plataforma. */
export const CHATWOOT_LOGIN_URL = `${CHATWOOT_FRONTEND_URL}/app/login`;

/** Contraseña temporal con la que el backend crea la cuenta del cliente. */
export const CHATWOOT_DEFAULT_PASSWORD = "Default123!";
