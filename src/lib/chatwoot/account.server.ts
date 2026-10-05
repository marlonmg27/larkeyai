/**
 * Paso 1 del onboarding: crea la cuenta y el usuario en la plataforma de
 * conversaciones a través del backend de Python (FastAPI).
 *
 *   POST ${BACKEND_URL}/onboarding
 *   header: X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}
 *
 * El backend es quien escribe users.chatwoot_user_id y users.chatwoot_account_id,
 * y quien define la contraseña inicial. El frontend nunca envía contraseñas.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

const TIMEOUT_MS = 15_000;

export type CreateChatwootAccountInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
};

export type CreateChatwootAccountResult = {
  ok: boolean;
  status: string | null;
  message: string | null;
};

export async function createChatwootAccount(
  input: CreateChatwootAccountInput,
): Promise<CreateChatwootAccountResult> {
  const baseUrl = process.env["BACKEND_URL"];
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];

  if (!baseUrl || !internalSecret) {
    console.error("[chatwoot-account] BACKEND_URL o BACKEND_INTERNAL_SECRET sin configurar");
    throw new Error("La creación de tu cuenta no está configurada todavía.");
  }

  const resolved = resolveBackendBaseUrl(baseUrl);
  if (!resolved.ok) {
    console.error("[chatwoot-account] BACKEND_URL inválida", {
      reason: resolved.reason,
      ...resolved.detail,
    });
    throw new Error("La creación de tu cuenta no está configurada todavía.");
  }

  const { backendOnboardingEnabled } = await import("@/lib/onboarding/backend.server");
  if (backendOnboardingEnabled()) {
    return createTenantAndChatwoot(input, resolved.base);
  }

  const target = new URL(`${resolved.base}/onboarding`);

  let res: Response;
  try {
    res = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        user_id: input.userId,
        email: input.email,
        name: `${input.firstName} ${input.lastName}`.trim(),
        company_name: input.companyName,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[chatwoot-account] fetch falló", {
      user_id: input.userId,
      host: target.host,
      path: target.pathname,
      reason: name,
    });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error(
      `No pudimos contactar al servicio (${target.host}). Verifica que el backend esté publicado y accesible.`,
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
    console.error("[chatwoot-account] backend respondió no-2xx", {
      user_id: input.userId,
      host: target.host,
      status: res.status,
    });
    const detail =
      parsed && typeof parsed === "object"
        ? ((parsed as Record<string, unknown>)["detail"] ??
           (parsed as Record<string, unknown>)["message"])
        : null;
    throw new Error(
      typeof detail === "string" && detail.length > 0
        ? detail.slice(0, 300)
        : `El servicio respondió con un error (${res.status}).`,
    );
  }

  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  return {
    ok: true,
    status: typeof obj["status"] === "string" ? obj["status"] : null,
    message: typeof obj["message"] === "string" ? obj["message"] : null,
  };
}

async function createTenantAndChatwoot(
  input: CreateChatwootAccountInput,
  base: string,
): Promise<CreateChatwootAccountResult> {
  const { backendJsonHeaders } = await import("@/lib/onboarding/backend.server");
  const headers = backendJsonHeaders(input.userId);

  const provision = await fetch(`${base}/tenants/provision/supabase`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      tenant_name: input.companyName,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!provision.ok) {
    throw new Error(await errorMessage(provision, "No pudimos crear tu organización."));
  }

  const chatwoot = await fetch(`${base}/onboarding/chatwoot`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!chatwoot.ok) {
    throw new Error(await errorMessage(chatwoot, "No pudimos preparar la plataforma de conversaciones."));
  }

  const body = (await chatwoot.json().catch(() => null)) as { provisioned?: boolean } | null;
  return {
    ok: true,
    status: body?.provisioned ? "connected" : "pending",
    message: body?.provisioned
      ? "Tu cuenta está lista."
      : "Tu organización está lista. La plataforma de conversaciones se activará cuando esté disponible.",
  };
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const raw = await res.text().catch(() => "");
  try {
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    const detail = parsed?.["detail"] ?? parsed?.["message"];
    if (typeof detail === "string" && detail.length > 0) return detail.slice(0, 300);
  } catch {
    // The body was not JSON; use the fallback.
  }
  return `${fallback} (${res.status}).`;
}
