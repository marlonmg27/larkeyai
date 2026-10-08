/**
 * Login and register against the Larkey API, then store the JWT in an
 * httpOnly cookie. The handler also returns the token so the client can
 * attach it on later server functions.
 */
import type { AuthUser } from "@/lib/auth/token";
import { tokenMaxAgeSeconds, verifyAccessToken } from "@/lib/auth/jwt.server";
import { clearSessionCookie, readRequestAccessToken, writeSessionCookie } from "@/lib/auth/session-cookie.server";
import { BackendHttpError, callBackend } from "@/lib/backend/http.server";

const AUTH_TIMEOUT_MS = 15_000;

export type AuthSession = AuthUser & { accessToken: string };

type TokenBody = {
  access_token?: unknown;
  user_id?: unknown;
  tenant_id?: unknown;
  email?: unknown;
};

export async function loginWithBackend(input: { email: string; password: string }): Promise<AuthSession> {
  return exchange("/auth/login", {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
}

export async function registerWithBackend(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  phoneNumber?: string;
}): Promise<AuthSession> {
  return exchange("/auth/register", {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    tenant_name: input.tenantName.trim(),
    ...(input.phoneNumber ? { phone_number: input.phoneNumber } : {}),
  });
}

export async function readVerifiedSession(): Promise<AuthUser | null> {
  const token = readRequestAccessToken();
  if (!token) return null;
  try {
    const claims = await verifyAccessToken(token);
    return { id: claims.sub, email: claims.email, tenantId: claims.tenantId };
  } catch {
    return null;
  }
}

export function endSession(): void {
  clearSessionCookie();
}

async function exchange(path: "/auth/login" | "/auth/register", body: unknown): Promise<AuthSession> {
  let parsed: unknown;
  try {
    parsed = await callBackend(path, {
      method: "POST",
      body,
      timeoutMs: AUTH_TIMEOUT_MS,
      internalSecret: false,
    });
  } catch (err) {
    if (err instanceof BackendHttpError) {
      throw new Error(authErrorMessage(path, err.status));
    }
    throw err;
  }

  const tokenBody = (parsed ?? {}) as TokenBody;
  const accessToken = typeof tokenBody.access_token === "string" ? tokenBody.access_token : "";
  const userId = typeof tokenBody.user_id === "string" ? tokenBody.user_id : "";
  const tenantId = typeof tokenBody.tenant_id === "string" ? tokenBody.tenant_id : "";
  const email = typeof tokenBody.email === "string" ? tokenBody.email : "";
  if (!accessToken || !userId || !tenantId || !email) {
    throw new Error("El servicio no devolvió una sesión.");
  }

  await verifyAccessToken(accessToken);
  writeSessionCookie(accessToken, tokenMaxAgeSeconds(accessToken));
  return { accessToken, id: userId, email, tenantId };
}

function authErrorMessage(path: "/auth/login" | "/auth/register", status: number): string {
  if (status === 401) return "Correo o contraseña incorrectos.";
  if (status === 409) return "Ya existe una cuenta con ese correo.";
  if (status === 400) return "No pudimos completar el acceso. Revisa los datos.";
  if (path === "/auth/register") return "No pudimos crear la cuenta. Inténtalo de nuevo.";
  return "No pudimos iniciar sesión. Inténtalo de nuevo.";
}
