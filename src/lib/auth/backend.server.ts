/**
 * Backend-owned login/register (server-only).
 *
 * BACKEND_AUTH_ENABLED stays off until jira on the deployed branch exposes
 * POST /auth/login and POST /auth/register. While it is off, the app keeps
 * the Supabase Auth path.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

const TIMEOUT_MS = 15_000;

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
  email: string;
  tenant_slug: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  tenant_name: string;
  phone_number?: string;
  timezone?: string;
  locale?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  tenant_id?: string;
};

export function backendAuthEnabled(): boolean {
  return process.env["BACKEND_AUTH_ENABLED"] === "true";
}

/** Onboarding relays use the backend path when either flag is on. */
export function backendTenantPathEnabled(): boolean {
  return (
    backendAuthEnabled() || process.env["BACKEND_ONBOARDING_ENABLED"] === "true"
  );
}

export function backendBaseUrl(): string {
  const baseUrl = process.env["BACKEND_URL"];
  if (!baseUrl) {
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  const resolved = resolveBackendBaseUrl(baseUrl);
  if (!resolved.ok) {
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  return resolved.base;
}

/**
 * Headers for Lovable → jira relays when the caller has a backend JWT.
 * Prefer Bearer; X-User-Id is users.id (Postgres), not a Supabase auth id.
 */
export function backendAuthRelayHeaders(opts: {
  userId: string;
  accessToken: string;
  tenantId?: string;
}): Record<string, string> {
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];
  if (!internalSecret) {
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Internal-Secret": internalSecret,
    "X-User-Id": opts.userId,
    Authorization: `Bearer ${opts.accessToken}`,
  };
  if (opts.tenantId) {
    headers["X-Tenant-Id"] = opts.tenantId;
  }
  return headers;
}

function authRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];
  if (internalSecret) {
    headers["X-Internal-Secret"] = internalSecret;
  }
  return headers;
}

async function postAuth(path: "/auth/login" | "/auth/register", body: unknown): Promise<AuthTokenResponse> {
  const target = new URL(`${backendBaseUrl()}${path}`);
  let res: Response;
  try {
    res = await fetch(target.toString(), {
      method: "POST",
      headers: authRequestHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[backend-auth] fetch failed", { path, reason: name });
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("El servicio tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw new Error("No pudimos contactar al servicio de autenticación.");
  }

  const raw = await res.text().catch(() => "");
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const detail =
      parsed && typeof parsed === "object"
        ? ((parsed as Record<string, unknown>)["detail"] ??
          (parsed as Record<string, unknown>)["message"])
        : null;
    throw new Error(
      typeof detail === "string" && detail.length > 0
        ? detail.slice(0, 300)
        : `El servicio de autenticación respondió con un error (${res.status}).`,
    );
  }

  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const access_token = obj["access_token"];
  const user_id = obj["user_id"] != null ? String(obj["user_id"]) : "";
  const tenant_id = obj["tenant_id"] != null ? String(obj["tenant_id"]) : "";
  const email = obj["email"] != null ? String(obj["email"]) : "";
  const tenant_slug = obj["tenant_slug"] != null ? String(obj["tenant_slug"]) : "";
  if (typeof access_token !== "string" || !user_id || !tenant_id || !email || !tenant_slug) {
    throw new Error("El servicio de autenticación devolvió una respuesta incompleta.");
  }

  return {
    access_token,
    token_type: typeof obj["token_type"] === "string" ? obj["token_type"] : "bearer",
    user_id,
    tenant_id,
    email,
    tenant_slug,
  };
}

export async function backendLogin(input: LoginInput): Promise<AuthTokenResponse> {
  const body: Record<string, unknown> = {
    email: input.email,
    password: input.password,
  };
  if (input.tenant_id) body["tenant_id"] = input.tenant_id;
  return postAuth("/auth/login", body);
}

export async function backendRegister(input: RegisterInput): Promise<AuthTokenResponse> {
  const body: Record<string, unknown> = {
    email: input.email,
    password: input.password,
    first_name: input.first_name,
    last_name: input.last_name,
    tenant_name: input.tenant_name,
    timezone: input.timezone ?? "UTC",
    locale: input.locale ?? "en",
  };
  if (input.phone_number) body["phone_number"] = input.phone_number;
  return postAuth("/auth/register", body);
}
