/**
 * Estado de onboarding del tenant. El sondeo se queda en 15s.
 */
import { BackendHttpError, callBackend } from "@/lib/backend/http.server";

const TIMEOUT_MS = 15_000;

export type OnboardingStatus = {
  enabled: boolean;
  hasTenant: boolean;
  chatwootProvisioned: boolean;
  whatsappStatus: string | null;
  /** Motivo del último fallo del Paso 2 (solo cuando whatsappStatus es "error"). */
  whatsappError: string | null;
};

type ConnectionRow = { status?: string; error_reason?: string | null };

export async function fetchOnboardingStatus(token: string): Promise<OnboardingStatus> {
  try {
    const body = (await callBackend("/onboarding/status", {
      method: "GET",
      token,
      timeoutMs: TIMEOUT_MS,
    })) as {
      chatwoot_provisioned?: boolean;
      connections?: ConnectionRow[];
    };
    const rows = body.connections ?? [];
    const statuses = rows
      .map((row) => row.status)
      .filter((status): status is string => !!status);
    const whatsappStatus = pickStatus(statuses);
    const errorRow = rows.find((row) => row.status === "error" && row.error_reason);
    return {
      enabled: true,
      hasTenant: true,
      chatwootProvisioned: body.chatwoot_provisioned === true,
      whatsappStatus,
      whatsappError: whatsappStatus === "error" ? (errorRow?.error_reason ?? null) : null,
    };
  } catch (err) {
    if (err instanceof BackendHttpError && err.status === 404) {
      return {
        enabled: true,
        hasTenant: false,
        chatwootProvisioned: false,
        whatsappStatus: null,
        whatsappError: null,
      };
    }
    throw new Error("No pudimos leer el estado de tu conexión.");
  }
}

function pickStatus(statuses: string[]): string | null {
  if (statuses.length === 0) return null;
  if (statuses.includes("connected")) return "connected";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("error")) return "error";
  return statuses[0] ?? null;
}
