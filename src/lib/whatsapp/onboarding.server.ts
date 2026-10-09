/**
 * Envía el alta de WhatsApp al backend.
 *
 *   POST ${BACKEND_URL}/onboarding/whatsapp
 *   Authorization: Bearer <JWT>
 *   X-Internal-Secret
 *
 * El backend responde "pending" enseguida y crea el inbox en segundo plano; el
 * dashboard consulta /onboarding/status hasta "connected" o "error". El timeout
 * de 60s queda como margen. Nunca se registra el access token.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";
import { BackendHttpError, callBackend, safePublicDetail } from "@/lib/backend/http.server";

const TIMEOUT_MS = 60_000;

export type ConnectWhatsAppInput = {
  token: string;
  wabaName: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
};

export type ConnectWhatsAppResult = {
  ok: boolean;
  status: string | null;
  message: string | null;
};

export async function connectWhatsApp(input: ConnectWhatsAppInput): Promise<ConnectWhatsAppResult> {
  const accessToken = input.accessToken.trim();
  if (!accessToken) {
    console.error("[whatsapp-onboarding] sin Api Key");
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }

  const resolved = resolveBackendBaseUrl(process.env["BACKEND_URL"]);
  if (!resolved.ok) {
    console.error("[whatsapp-onboarding] BACKEND_URL inválida", {
      reason: resolved.reason,
      ...resolved.detail,
    });
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }

  let parsed: unknown;
  try {
    parsed = await callBackend("/onboarding/whatsapp", {
      method: "POST",
      token: input.token,
      timeoutMs: TIMEOUT_MS,
      body: {
        waba_name: input.wabaName,
        phone_number: input.phoneNumber,
        phone_number_id: input.phoneNumberId,
        waba_id: input.wabaId,
        access_token: accessToken,
      },
    });
  } catch (err) {
    if (err instanceof BackendHttpError) {
      throw new Error(
        err.status === 409
          ? whatsappConflict(err.detail)
          : "No pudimos conectar WhatsApp. Inténtalo de nuevo.",
      );
    }
    throw err;
  }

  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as { status?: unknown };
  return {
    ok: true,
    status: typeof obj.status === "string" ? obj.status : null,
    message: null,
  };
}

function whatsappConflict(detail: unknown): string {
  const safe = safePublicDetail(detail);
  if (!safe || /another tenant/i.test(safe)) {
    return "Ese número de WhatsApp ya está conectado a otra organización.";
  }
  return safe;
}
