/**
 * Envía el onboarding del canal de mensajería al backend de Python (FastAPI).
 *
 * FastAPI mapping:
 *   POST ${BACKEND_URL}/onboarding/whatsapp
 *   header: X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}
 *
 * Nunca registra el access token en logs.
 */
import { messagingChannels, type MessagingChannel } from "@/lib/whatsapp/schema";
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

const TIMEOUT_MS = 15_000;

export type ConnectWhatsAppInput = {
  userId: string;
  channel: MessagingChannel;
  displayName: string;
  userName: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  /** Resueltos en el servidor desde public.users, nunca capturados por el usuario. */
  chatwootUserId: number;
  chatwootAccountId: number;
  /** Se muestra como "Api Key" en el formulario. Nunca se registra en logs. */
  accessToken?: string;
};


export type ConnectWhatsAppResult = {
  ok: boolean;
  status: string | null;
  message: string | null;
};

export async function connectWhatsApp(
  input: ConnectWhatsAppInput,
): Promise<ConnectWhatsAppResult> {
  const baseUrl = process.env["BACKEND_URL"];
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];
  // Se reenvía la Api Key que capturó el usuario; si viniera vacía usamos el secreto del servidor.
  const clientToken = input.accessToken?.trim() ?? "";
  const accessToken = clientToken.length > 0 ? clientToken : process.env["WABA_ACCESS_TOKEN"];

  if (!baseUrl || !internalSecret) {
    console.error("[whatsapp-onboarding] BACKEND_URL o BACKEND_INTERNAL_SECRET sin configurar");
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }

  if (!accessToken) {
    console.error("[whatsapp-onboarding] sin Api Key del usuario ni WABA_ACCESS_TOKEN");
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }


  // Normalizamos y validamos la URL antes de intentar la conexión: un valor
  // inválido o no HTTPS nunca es alcanzable desde el runtime publicado.
  const resolved = resolveBackendBaseUrl(baseUrl);
  if (!resolved.ok) {
    console.error("[whatsapp-onboarding] BACKEND_URL inválida", {
      reason: resolved.reason,
      ...resolved.detail,
    });
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }
  const target = new URL(`${resolved.base}/onboarding/whatsapp`);

  // El canal se fija a un valor permitido del servidor, no se confía en texto libre.
  const channel: MessagingChannel = messagingChannels.includes(input.channel)
    ? input.channel
    : "whatsapp";

  const url = target.toString();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        channel,
        user_id: input.userId,
        display_name: input.displayName,
        user_name: input.userName,
        email: input.email,
        phone_number: input.phoneNumber,
        phone_number_id: input.phoneNumberId,
        waba_id: input.wabaId,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    const detail = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : null;
    console.error("[whatsapp-onboarding] fetch falló", {
      user_id: input.userId,
      host: target.host,
      path: target.pathname,
      reason: name,
      detail,
      cause,
    });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio de WhatsApp tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error(
      `No pudimos contactar al servicio de WhatsApp (${target.host}). Verifica que el backend esté publicado y accesible.`,
    );
  }


  const raw = await res.text().catch(() => "");
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    console.error("[whatsapp-onboarding] backend respondió no-2xx", {
      user_id: input.userId,
      host: target.host,
      status: res.status,
    });

    const detail =
      parsed && typeof parsed === "object"
        ? ((parsed as Record<string, unknown>)["detail"] ??
           (parsed as Record<string, unknown>)["message"])
        : null;
    const message =
      typeof detail === "string" && detail.length > 0
        ? detail.slice(0, 300)
        : `El servicio de WhatsApp respondió con un error (${res.status}).`;
    throw new Error(message);
  }

  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  return {
    ok: true,
    status: typeof obj["status"] === "string" ? obj["status"] : null,
    message: typeof obj["message"] === "string" ? obj["message"] : null,
  };
}
