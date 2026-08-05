/**
 * Envía el onboarding de WhatsApp al backend de Python (FastAPI).
 *
 * FastAPI mapping:
 *   POST ${BACKEND_URL}/onboarding/whatsapp
 *   header: X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}
 *
 * Nunca registra el access token en logs.
 */
const TIMEOUT_MS = 15_000;

export type ConnectWhatsAppInput = {
  userId: string;
  displayName: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
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

  if (!baseUrl || !internalSecret) {
    console.error("[whatsapp-onboarding] BACKEND_URL o BACKEND_INTERNAL_SECRET sin configurar");
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/onboarding/whatsapp`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        user_id: input.userId,
        display_name: input.displayName,
        phone_number_id: input.phoneNumberId,
        waba_id: input.wabaId,
        access_token: input.accessToken,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[whatsapp-onboarding] fetch falló", { user_id: input.userId, reason: name });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio de WhatsApp tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error("No pudimos contactar al servicio de WhatsApp. Inténtalo de nuevo en un momento.");
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
