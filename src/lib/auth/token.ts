/**
 * Client copy of the access token. Server functions also receive it as an
 * httpOnly cookie; this copy is what the function middleware attaches as
 * Authorization, matching the previous Supabase session attacher.
 */
const STORAGE_KEY = "larkey.access_token";
export const AUTH_EVENT = "larkey-auth";

export type AuthUser = {
  id: string;
  email: string;
  tenantId: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(STORAGE_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAccessToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked; the cookie clear still signs the server out.
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function onAuthChange(listener: () => void): () => void {
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
}
