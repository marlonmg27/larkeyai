/**
 * Reads onboarding state from the backend, which owns tenants and channels.
 * Lovable does not write those rows.
 */
import {
  backendAuthEnabled,
  backendAuthRelayHeaders,
  backendBaseUrl,
  backendTenantPathEnabled,
} from "@/lib/auth/backend.server";
import { backendJsonHeaders } from "@/lib/onboarding/backend.server";

const TIMEOUT_MS = 15_000;

export type OnboardingStatus = {
  enabled: boolean;
  hasTenant: boolean;
  chatwootProvisioned: boolean;
  whatsappStatus: string | null;
};

const disabled: OnboardingStatus = {
  enabled: false,
  hasTenant: false,
  chatwootProvisioned: false,
  whatsappStatus: null,
};

type ConnectionRow = { status?: string };

export async function fetchOnboardingStatus(
  userId: string,
  opts?: { accessToken?: string; tenantId?: string },
): Promise<OnboardingStatus> {
  if (!backendTenantPathEnabled()) return disabled;

  const headers =
    backendAuthEnabled() && opts?.accessToken
      ? backendAuthRelayHeaders({
          userId,
          accessToken: opts.accessToken,
          tenantId: opts.tenantId,
        })
      : backendJsonHeaders(userId);

  const target = new URL(`${backendBaseUrl()}/onboarding/status`);
  const res = await fetch(target.toString(), {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status === 404) {
    return { enabled: true, hasTenant: false, chatwootProvisioned: false, whatsappStatus: null };
  }
  if (!res.ok) {
    throw new Error(`No pudimos leer el estado de tu conexión (${res.status}).`);
  }

  const body = (await res.json()) as {
    chatwoot_provisioned?: boolean;
    connections?: ConnectionRow[];
  };
  const statuses = (body.connections ?? []).map((row) => row.status).filter((status): status is string => !!status);

  return {
    enabled: true,
    hasTenant: true,
    chatwootProvisioned: body.chatwoot_provisioned === true,
    whatsappStatus: pickStatus(statuses),
  };
}

function pickStatus(statuses: string[]): string | null {
  if (statuses.length === 0) return null;
  if (statuses.includes("connected")) return "connected";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("error")) return "error";
  return statuses[0] ?? null;
}
