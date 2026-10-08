/**
 * Browser storage for the backend access token when BACKEND_AUTH_ENABLED is on.
 * Mirrors the Bearer pattern used by attachSupabaseAuth.
 */

const TOKEN_KEY = "larkey:backend_access_token";
const USER_KEY = "larkey:backend_auth_user";
export const BACKEND_AUTH_EVENT = "larkey:backend-auth";

export type BackendAuthUser = {
  id: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
};

export type BackendSession = {
  access_token: string;
  user: BackendAuthUser;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BACKEND_AUTH_EVENT));
}

export function getBackendAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getBackendAuthUser(): BackendAuthUser | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackendAuthUser;
    if (
      typeof parsed?.id === "string" &&
      typeof parsed?.email === "string" &&
      typeof parsed?.tenantId === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getBackendSession(): BackendSession | null {
  const access_token = getBackendAccessToken();
  const user = getBackendAuthUser();
  if (!access_token || !user) return null;
  return { access_token, user };
}

export function storeBackendSession(input: {
  access_token: string;
  user_id: string;
  tenant_id: string;
  email: string;
  tenant_slug: string;
}): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(TOKEN_KEY, input.access_token);
  window.localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: input.user_id,
      email: input.email,
      tenantId: input.tenant_id,
      tenantSlug: input.tenant_slug,
    } satisfies BackendAuthUser),
  );
  notify();
}

export function clearBackendSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notify();
}

export function hasBackendSession(): boolean {
  return getBackendSession() !== null;
}
