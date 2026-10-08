/**
 * Server-side calls to the Larkey API. Authenticated routes send the
 * caller's Bearer JWT and X-Internal-Secret. Tokens are never logged.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

export class BackendHttpError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "BackendHttpError";
    this.status = status;
    this.detail = detail;
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type BackendCall = {
  method: Method;
  /** When set, sends Authorization: Bearer. */
  token?: string;
  /** Relay header for service routes that identify the user without a JWT. */
  userId?: string;
  body?: unknown;
  timeoutMs: number;
  /** Login and register do not require the internal secret. */
  internalSecret?: boolean;
};

function resolveBase(): { base: string; host: string } {
  const raw = process.env["BACKEND_URL"];
  if (!raw) {
    console.error("[backend] BACKEND_URL sin configurar");
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  const resolved = resolveBackendBaseUrl(raw);
  if (!resolved.ok) {
    console.error("[backend] BACKEND_URL inválida", { reason: resolved.reason, ...resolved.detail });
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  if (resolved.host === "connector-gateway.lovable.dev") {
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  return { base: resolved.base, host: resolved.host };
}

function requireInternalSecret(): string {
  const secret = process.env["BACKEND_INTERNAL_SECRET"];
  if (!secret) {
    console.error("[backend] BACKEND_INTERNAL_SECRET sin configurar");
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  return secret;
}

/** A short human sentence. Rejects Chatwoot/API JSON dumps. */
export function safePublicDetail(detail: unknown): string | null {
  if (typeof detail !== "string") return null;
  const text = detail.trim();
  if (!text || text.length > 280) return null;
  if (text.startsWith("{") || text.startsWith("[")) return null;
  if (text.includes("{") || text.includes("}")) return null;
  if (/"errors"\s*:/.test(text) || /"payload"\s*:/.test(text)) return null;
  return text;
}

export async function callBackend(path: string, call: BackendCall): Promise<unknown> {
  const { base, host } = resolveBase();
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  const headers: Record<string, string> = {};
  if (call.internalSecret !== false) {
    headers["X-Internal-Secret"] = requireInternalSecret();
  }
  if (call.token) headers["Authorization"] = `Bearer ${call.token}`;
  if (call.userId) headers["X-User-Id"] = call.userId;
  if (call.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: call.method,
      headers,
      body: call.body === undefined ? undefined : JSON.stringify(call.body),
      signal: AbortSignal.timeout(call.timeoutMs),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[backend] fetch falló", { host, path: url.pathname, method: call.method, reason: name });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error(`No pudimos contactar al servicio (${host}).`);
  }

  const raw = await res.text().catch(() => "");
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const detail =
      parsed && typeof parsed === "object"
        ? ((parsed as Record<string, unknown>)["detail"] ?? (parsed as Record<string, unknown>)["message"])
        : null;
    console.error("[backend] respuesta no-2xx", { host, path: url.pathname, method: call.method, status: res.status });
    const safe = safePublicDetail(detail);
    throw new BackendHttpError(
      safe ?? `El servicio respondió con un error (${res.status}).`,
      res.status,
      detail,
    );
  }

  return parsed;
}
