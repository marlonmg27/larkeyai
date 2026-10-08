/**
 * Puente de conexiones de WhatsApp. Las lecturas y altas van al backend
 * (GET /account, GET /onboarding/status, POST /onboarding/whatsapp).
 */
import { z } from "zod";

import { json, parseBody, verifyInternalSecret } from "@/lib/api/internal.server";
import { BackendHttpError, callBackend } from "@/lib/backend/http.server";

export { json, parseBody, verifyInternalSecret };
export type { ParsedBody } from "@/lib/api/internal.server";

export const connectionStatuses = ["not_connected", "pending", "connected", "error"] as const;
export type ConnectionStatus = (typeof connectionStatuses)[number];

const persistedShape = {
  user_id: z.string().uuid(),
  status: z.enum(connectionStatuses),
  phone_number: z.string().trim().max(40).nullish(),
  chatwoot_inbox_id: z.coerce.number().int().nullish(),
  waba_id: z.coerce.number().int().nullish(),
  phone_number_id: z.string().trim().max(64).nullish(),
  chatwoot_user_id: z.coerce.number().int().nullish(),
  chatwoot_account_id: z.coerce.number().int().nullish(),
  waba_name: z.string().trim().max(200).nullish(),
};

export const upsertConnectionSchema = z.object(persistedShape).passthrough();

export const patchConnectionSchema = z
  .object({ ...persistedShape, status: z.enum(connectionStatuses).optional() })
  .passthrough();

export const findByPhoneSchema = z.object({
  phone_number: z.string().trim().min(5).max(40),
});

type ConnectionWrite = {
  user_id: string;
  status?: ConnectionStatus;
  phone_number?: string | null;
  waba_id?: number | null;
  phone_number_id?: string | null;
  waba_name?: string | null;
  access_token?: unknown;
};

export async function upsertConnection(data: ConnectionWrite): Promise<Response> {
  return writeWhatsapp(data);
}

export async function patchConnectionStatus(data: ConnectionWrite): Promise<Response> {
  return writeWhatsapp(data);
}

export async function findConnectionByPhone(phoneNumber: string): Promise<Response> {
  // The live API has no cross-tenant phone lookup. The backend resolves the
  // channel from its own database when a message arrives.
  console.info("[whatsapp-connections] búsqueda por teléfono delegada al backend", {
    digits: phoneNumber.replace(/\D/g, "").length,
  });
  return json({ ok: false, error: "connection_not_found" }, 404);
}

async function writeWhatsapp(data: ConnectionWrite): Promise<Response> {
  const accessToken = typeof data.access_token === "string" ? data.access_token.trim() : "";
  if (!data.waba_name || !data.phone_number || !data.phone_number_id || data.waba_id == null || !accessToken) {
    return json(
      { ok: false, error: "validation_error", detail: "Faltan los datos de WhatsApp para registrar la conexión." },
      400,
    );
  }

  try {
    const result = (await callBackend("/onboarding/whatsapp", {
      method: "POST",
      userId: data.user_id,
      timeoutMs: 60_000,
      body: {
        waba_name: data.waba_name,
        phone_number: data.phone_number,
        phone_number_id: data.phone_number_id,
        waba_id: String(data.waba_id),
        access_token: accessToken,
      },
    })) as { status?: string };
    return json(
      {
        ok: true,
        user_id: data.user_id,
        status: result.status ?? data.status ?? "pending",
        created: false,
      },
      200,
    );
  } catch (err) {
    const status = err instanceof BackendHttpError ? err.status : 502;
    console.error("[whatsapp-connections] alta falló", { status });
    return json({ ok: false, error: "backend_error" }, status >= 400 && status < 600 ? status : 502);
  }
}
