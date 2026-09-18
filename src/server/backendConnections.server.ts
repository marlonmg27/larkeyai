/**
 * Cliente server-only de las conexiones de conectores (app users) que ahora
 * viven en la base de datos del backend de Python (FastAPI).
 *
 *   PUT    ${BACKEND_URL}/connectors/connections
 *   GET    ${BACKEND_URL}/connectors/connections/{user_id}/{connector_id}
 *   DELETE ${BACKEND_URL}/connectors/connections/{user_id}/{connector_id}
 *
 * Autenticado con `X-Internal-Secret`. Nunca se registran llaves ni secretos.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

const TIMEOUT_MS = 15_000;

export interface StoredConnection {
  connection_key?: string | null;
  connection_key_ciphertext?: string | null;
}

function resolveTarget(): { base: string; secret: string } {
  const rawUrl = process.env["BACKEND_URL"];
  const secret = process.env["BACKEND_INTERNAL_SECRET"];

  if (!rawUrl || !secret) {
    console.error("[connectors] BACKEND_URL o BACKEND_INTERNAL_SECRET sin configurar");
    throw new Error("La conexión con el servicio de conectores no está configurada todavía.");
  }

  const resolved = resolveBackendBaseUrl(rawUrl);
  if (!resolved.ok) {
    console.error("[connectors] BACKEND_URL inválida", {
      reason: resolved.reason,
      ...resolved.detail,
    });
    throw new Error("La conexión con el servicio de conectores no está configurada todavía.");
  }

  return { base: resolved.base, secret };
}

async function request(
  path: string,
  init: { method: string; body?: unknown },
): Promise<{ status: number; parsed: unknown }> {
  const { base, secret } = resolveTarget();
  const url = new URL(`${base}${path}`);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[connectors] fetch falló", {
      host: url.host,
      path: url.pathname,
      method: init.method,
      reason: name,
    });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio de conectores tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error(
      `No pudimos contactar al servicio de conectores (${url.host}). Verifica que el backend esté publicado y accesible.`,
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
    console.error("[connectors] backend respondió no-2xx", {
      host: url.host,
      path: url.pathname,
      method: init.method,
      status: res.status,
    });
    const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
    const detail = obj["detail"] ?? obj["message"] ?? obj["error"];
    throw new Error(
      typeof detail === "string" && detail.length > 0
        ? detail.slice(0, 300)
        : `El servicio de conectores respondió con un error (${res.status}).`,
    );
  }

  return { status: res.status, parsed };
}

function extractConnection(parsed: unknown): StoredConnection | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const candidate =
    obj["connection"] && typeof obj["connection"] === "object"
      ? (obj["connection"] as Record<string, unknown>)
      : obj;

  const plain = candidate["connection_key"];
  const cipher = candidate["connection_key_ciphertext"];
  if (typeof plain !== "string" && typeof cipher !== "string") return null;

  return {
    connection_key: typeof plain === "string" ? plain : null,
    connection_key_ciphertext: typeof cipher === "string" ? cipher : null,
  };
}

export async function putConnection(input: {
  userId: string;
  connectorId: string;
  connectionKey: string;
  connectionKeyCiphertext: string;
}): Promise<void> {
  await request("/connectors/connections", {
    method: "PUT",
    body: {
      user_id: input.userId,
      connector_id: input.connectorId,
      connection_key: input.connectionKey,
      connection_key_ciphertext: input.connectionKeyCiphertext,
    },
  });
}

export async function fetchConnection(
  userId: string,
  connectorId: string,
): Promise<StoredConnection | null> {
  const { status, parsed } = await request(
    `/connectors/connections/${encodeURIComponent(userId)}/${encodeURIComponent(connectorId)}`,
    { method: "GET" },
  );
  if (status === 404) return null;
  return extractConnection(parsed);
}

export async function removeConnection(userId: string, connectorId: string): Promise<void> {
  await request(
    `/connectors/connections/${encodeURIComponent(userId)}/${encodeURIComponent(connectorId)}`,
    { method: "DELETE" },
  );
}
