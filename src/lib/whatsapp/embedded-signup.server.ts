/**
 * Reenvío del `code` del Embedded Signup al backend de Python (FastAPI).
 *
 *   POST ${BACKEND_URL}/onboarding/whatsapp/embedded_signup
 *   header: X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}
 *
 * Nunca se loguea el `code` ni el secreto interno.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

const TIMEOUT_MS = 15_000;

export type EmbeddedSignupInput = {
  userId: string;
  code: string;
  wabaId?: string | undefined;
  phoneNumberId?: string | undefined;
};

export type EmbeddedSignupResult = {
  ok: boolean;
  status: string | null;
  message: string | null;
};

export async function forwardEmbeddedSignup(
  input: EmbeddedSignupInput,
): Promise<EmbeddedSignupResult> {
  const baseUrl = process.env["BACKEND_URL"];
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];

  if (!baseUrl || !internalSecret) {
    console.error(
      "[whatsapp-embedded-signup] BACKEND_URL o BACKEND_INTERNAL_SECRET sin configurar",
    );
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }

  const resolved = resolveBackendBaseUrl(baseUrl);
  if (!resolved.ok) {
    console.error("[whatsapp-embedded-signup] BACKEND_URL inválida", {
      reason: resolved.reason,
      ...resolved.detail,
    });
    throw new Error("La conexión con el servicio de WhatsApp no está configurada todavía.");
  }

  const target = new URL(`${resolved.base}/onboarding/whatsapp/embedded_signup`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        channel: "whatsapp",
        user_id: input.userId,
        code: input.code,
        waba_id: input.wabaId ?? null,
        phone_number_id: input.phoneNumberId ?? null,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      console.error("[whatsapp-embedded-signup] backend respondió con error", {
        status: response.status,
        host: resolved.host,
      });
      throw new Error(
        typeof payload["detail"] === "string"
          ? (payload["detail"] as string)
          : "No pudimos completar la conexión con WhatsApp. Inténtalo de nuevo.",
      );
    }

    return {
      ok: true,
      status: typeof payload["status"] === "string" ? (payload["status"] as string) : "pending",
      message: typeof payload["message"] === "string" ? (payload["message"] as string) : null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[whatsapp-embedded-signup] timeout", { host: resolved.host });
      throw new Error("El servicio de WhatsApp tardó demasiado en responder. Inténtalo de nuevo.");
    }
    if (error instanceof Error && error.message) throw error;
    console.error("[whatsapp-embedded-signup] fallo de red", { host: resolved.host });
    throw new Error("No pudimos contactar al servicio de WhatsApp. Inténtalo de nuevo.");
  } finally {
    clearTimeout(timeout);
  }
}
