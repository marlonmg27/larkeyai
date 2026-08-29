/**
 * Instrucciones del agente — puente server-only con el backend de Python (FastAPI).
 *
 *   GET   ${BACKEND_URL}/agents/instructions/{phone_number}
 *   PATCH ${BACKEND_URL}/agents/instructions/
 *
 * Autenticado con `X-Internal-Secret`. Nunca se registran secretos en logs.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

const TIMEOUT_MS = 15_000;

type BackendTarget = { base: string; secret: string };

function resolveTarget(): BackendTarget {
  const rawUrl = process.env["BACKEND_URL"];
  const secret = process.env["BACKEND_INTERNAL_SECRET"];

  if (!rawUrl || !secret) {
    console.error("[agent-instructions] BACKEND_URL o BACKEND_INTERNAL_SECRET sin configurar");
    throw new Error("La conexión con el servicio del agente no está configurada todavía.");
  }

  const resolved = resolveBackendBaseUrl(rawUrl);
  if (!resolved.ok) {
    console.error("[agent-instructions] BACKEND_URL inválida", {
      reason: resolved.reason,
      ...resolved.detail,
    });
    throw new Error("La conexión con el servicio del agente no está configurada todavía.");
  }

  return { base: resolved.base, secret };
}

async function request(
  url: URL,
  init: { method: string; secret: string; body?: unknown },
): Promise<{ status: number; parsed: unknown }> {
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": init.secret,
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[agent-instructions] fetch falló", {
      host: url.host,
      path: url.pathname,
      method: init.method,
      reason: name,
    });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio del agente tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error(
      `No pudimos contactar al servicio del agente (${url.host}). Verifica que el backend esté publicado y accesible.`,
    );
  }

  const raw = await res.text().catch(() => "");
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok && res.status !== 404) {
    console.error("[agent-instructions] backend respondió no-2xx", {
      host: url.host,
      path: url.pathname,
      method: init.method,
      status: res.status,
    });
    const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
    const detail = obj["detail"] ?? obj["message"];
    throw new Error(
      typeof detail === "string" && detail.length > 0
        ? detail.slice(0, 300)
        : `El servicio del agente respondió con un error (${res.status}).`,
    );
  }

  return { status: res.status, parsed };
}

function extractInstructions(parsed: unknown): string {
  if (typeof parsed === "string") return parsed;
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["instructions", "instruction", "prompt", "text"]) {
      const value = obj[key];
      if (typeof value === "string") return value;
    }
    const data = obj["data"];
    if (data && typeof data === "object") return extractInstructions(data);
  }
  return "";
}

/** Devuelve las instrucciones actuales; cadena vacía si el agente aún no tiene. */
export async function getInstructions(phoneNumber: string): Promise<string> {
  const { base, secret } = resolveTarget();
  const url = new URL(`${base}/agents/instructions/${encodeURIComponent(phoneNumber)}`);
  const { status, parsed } = await request(url, { method: "GET", secret });
  if (status === 404) return "";
  return extractInstructions(parsed);
}

export async function saveInstructions(input: {
  phoneNumber: string;
  instructions: string;
  userId: string;
}): Promise<string> {
  const { base, secret } = resolveTarget();
  const url = new URL(`${base}/agents/instructions/`);
  const { parsed } = await request(url, {
    method: "PATCH",
    secret,
    body: {
      phone_number: input.phoneNumber,
      instructions: input.instructions,
      user_id: input.userId,
    },
  });
  const returned = extractInstructions(parsed);
  return returned.length > 0 ? returned : input.instructions;
}
