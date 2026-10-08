/**
 * Resuelve el número de WhatsApp del usuario autenticado desde GET /account.
 */
import { callBackend } from "@/lib/backend/http.server";

export async function resolveUserPhoneNumber(accessToken: string): Promise<string | null> {
  const account = (await callBackend("/account", {
    method: "GET",
    token: accessToken,
    timeoutMs: 15_000,
  })) as { connections?: Array<{ phone_number?: string | null }> };

  const phone = account.connections?.find((row) => row.phone_number?.trim())?.phone_number?.trim();
  return phone && phone.length > 0 ? phone : null;
}
