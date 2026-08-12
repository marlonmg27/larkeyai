/**
 * Configuración del Embedded Signup de WhatsApp Business (cliente).
 *
 * Estado actual: DESACTIVADO. La app de Meta todavía no está aprobada como
 * Tech Provider, así que el botón se renderiza deshabilitado y el SDK no se
 * carga. Para activarlo:
 *   1. Crear la configuración de Embedded Signup en el panel de Meta y poner su
 *      ID en `VITE_FB_WHATSAPP_CONFIG_ID`.
 *   2. Poner `VITE_WHATSAPP_EMBEDDED_SIGNUP_ENABLED=true`.
 */

const env = import.meta.env as Record<string, string | undefined>;

/** App ID de Meta (dato público). */
export const facebookAppId = env["VITE_FB_APP_ID"] ?? "871512495342882";

/** ID de la configuración de Embedded Signup. Vacío hasta la aprobación de Meta. */
export const embeddedSignupConfigId = env["VITE_FB_WHATSAPP_CONFIG_ID"] ?? "";

/** Versión de la Graph API usada por el SDK. */
export const graphApiVersion = "v23.0";

/** Flag maestro: mientras sea false el botón queda deshabilitado y el SDK no se carga. */
export const embeddedSignupEnabled =
  env["VITE_WHATSAPP_EMBEDDED_SIGNUP_ENABLED"] === "true" &&
  facebookAppId.length > 0 &&
  embeddedSignupConfigId.length > 0;

/** Etiqueta estática mientras la app está en revisión. */
export const embeddedSignupPendingLabel = "Próximamente / En proceso de aprobación de Meta";

/** Datos que Meta emite por `postMessage` durante el flujo. */
export type EmbeddedSignupSessionInfo = {
  wabaId?: string;
  phoneNumberId?: string;
};
