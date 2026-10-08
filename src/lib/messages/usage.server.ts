/**
 * Saldo de mensajes. La lectura sale de GET /account. El descuento lo aplica
 * el backend cuando envía un mensaje; esta app no escribe el saldo en Supabase.
 */
import { z } from "zod";

import { json } from "@/lib/api/internal.server";
import { BackendHttpError, callBackend } from "@/lib/backend/http.server";

export const canSendSchema = z.object({ user_id: z.string().uuid() }).passthrough();

export const decrementSchema = z
  .object({
    user_id: z.string().uuid(),
    count: z.number().int().min(1).max(1000).optional(),
  })
  .passthrough();

export type CanSendInput = z.infer<typeof canSendSchema>;
export type DecrementInput = z.infer<typeof decrementSchema>;

export async function canSendMessage(data: CanSendInput): Promise<Response> {
  try {
    const account = (await callBackend("/account", {
      method: "GET",
      userId: data.user_id,
      timeoutMs: 15_000,
    })) as { balance?: { messages_remaining?: number } | null };
    const remaining = account.balance?.messages_remaining ?? 0;
    return json({ ok: true, user_id: data.user_id, can_send: remaining > 0 }, 200);
  } catch (err) {
    if (err instanceof BackendHttpError && (err.status === 404 || err.status === 401)) {
      return json({ ok: true, user_id: data.user_id, can_send: false }, 200);
    }
    console.error("[messages] no se pudo leer el saldo", {
      status: err instanceof BackendHttpError ? err.status : null,
    });
    return json({ ok: false, error: "backend_error" }, 502);
  }
}

export async function decrementMessages(data: DecrementInput): Promise<Response> {
  return json(
    {
      ok: false,
      error: "usage_owned_by_backend",
      user_id: data.user_id,
      count: data.count ?? 1,
    },
    409,
  );
}
