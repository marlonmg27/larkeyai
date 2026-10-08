/**
 * Calls the Larkey backend onboarding endpoints.
 *
 * BACKEND_ONBOARDING_ENABLED stays off until the backend on `main` (the branch
 * Railway deploys) exposes these routes. While it is off, the dashboard keeps
 * the previous Supabase path.
 *
 * When BACKEND_AUTH_ENABLED is on (see `src/lib/auth/`), register already opens
 * the tenant — onboarding relays use Bearer + X-Internal-Secret and skip
 * POST /tenants/provision/supabase.
 */
import { resolveBackendBaseUrl } from "@/lib/backend-url.server";

export function backendOnboardingEnabled(): boolean {
  return process.env["BACKEND_ONBOARDING_ENABLED"] === "true";
}

export function backendJsonHeaders(userId: string): Record<string, string> {
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];
  if (!internalSecret) {
    throw new Error("La conexión con el servicio no está configurada todavía.");
  }
  return {
    "Content-Type": "application/json",
    "X-Internal-Secret": internalSecret,
    "X-User-Id": userId,
  };
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
