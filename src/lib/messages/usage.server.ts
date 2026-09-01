/**
 * Endpoints puente de saldo de mensajes (`can_send_message` y `decrement_messages`).
 *
 * Ambas funciones viven en este único módulo; las rutas solo validan el secreto
 * interno y el body. La lógica de saldo queda centralizada en las RPC de la base.
 */
import { z } from "zod";
import { json } from "@/lib/api/internal.server";

export const canSendSchema = z.object({ user_id: z.string().uuid() }).passthrough();

export const decrementSchema = z
  .object({
    user_id: z.string().uuid(),
    count: z.number().int().min(1).max(1000).default(1),
  })
  .passthrough();

export type CanSendInput = z.infer<typeof canSendSchema>;
export type DecrementInput = z.infer<typeof decrementSchema>;

export async function canSendMessage(data: CanSendInput): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: result, error } = await supabaseAdmin.rpc("can_send_message", {
    p_user_id: data.user_id,
  });

  if (error) {
    console.error("[messages] can_send_message falló", { code: error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }

  return json({ ok: true, user_id: data.user_id, can_send: result === true }, 200);
}

export async function decrementMessages(data: DecrementInput): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const balance = await supabaseAdmin
    .from("usage_balance")
    .select("user_id")
    .eq("user_id", data.user_id)
    .maybeSingle();

  if (balance.error) {
    console.error("[messages] select usage_balance falló", { code: balance.error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }
  if (!balance.data) {
    return json({ ok: false, error: "usage_balance_not_found" }, 404);
  }

  const { error } = await supabaseAdmin.rpc("decrement_messages", {
    p_user_id: data.user_id,
    p_count: data.count,
  });

  if (error) {
    console.error("[messages] decrement_messages falló", { code: error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }

  const after = await supabaseAdmin
    .from("usage_balance")
    .select("messages_remaining, messages_used_period")
    .eq("user_id", data.user_id)
    .maybeSingle();

  return json(
    {
      ok: true,
      user_id: data.user_id,
      count: data.count,
      messages_remaining: after.data?.messages_remaining ?? null,
      messages_used_period: after.data?.messages_used_period ?? null,
    },
    200,
  );
}
