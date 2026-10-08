/**
 * Paso 1 del onboarding: abre la cuenta de Chatwoot del tenant que ya
 * existe desde el registro. Solo POST /onboarding/chatwoot.
 */
import { BackendHttpError, callBackend, safePublicDetail } from "@/lib/backend/http.server";

const TIMEOUT_MS = 60_000;

const CHATWOOT_CONFLICT =
  "Ese correo ya tiene una cuenta en la plataforma de conversaciones.";

export type CreateChatwootAccountResult = {
  ok: boolean;
  status: string | null;
  message: string | null;
};

export async function createChatwootAccount(token: string): Promise<CreateChatwootAccountResult> {
  let parsed: unknown;
  try {
    parsed = await callBackend("/onboarding/chatwoot", {
      method: "POST",
      token,
      timeoutMs: TIMEOUT_MS,
    });
  } catch (err) {
    if (err instanceof BackendHttpError && err.status === 409) {
      throw new Error(safePublicDetail(err.detail) ?? CHATWOOT_CONFLICT);
    }
    if (err instanceof BackendHttpError) {
      throw new Error("No pudimos preparar la plataforma de conversaciones.");
    }
    throw err;
  }

  const body = (parsed && typeof parsed === "object" ? parsed : {}) as { provisioned?: unknown };
  const provisioned = body.provisioned === true;
  return {
    ok: true,
    status: provisioned ? "connected" : "pending",
    message: provisioned
      ? "Tu cuenta está lista."
      : "Tu organización está lista. La plataforma de conversaciones se activará cuando esté disponible.",
  };
}
