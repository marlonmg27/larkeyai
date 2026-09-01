/**
 * Endpoint puente: actualizar `chatwoot_user_id` / `chatwoot_account_id` en `users`.
 *
 * El backend FastAPI llama esto con `X-Internal-Secret` en vez de manejar la
 * service role key. Ninguna de las dos columnas está en el trigger de columnas
 * protegidas, así que la escritura con privilegios de servidor pasa sin problema.
 */
import { z } from "zod";
import { json } from "@/lib/api/internal.server";

const idSchema = z.number().int().nonnegative().nullish();

export const updateChatwootIdsSchema = z
  .object({
    user_id: z.string().uuid(),
    chatwoot_user_id: idSchema,
    chatwoot_account_id: idSchema,
  })
  .passthrough()
  .refine(
    (d) => d.chatwoot_user_id !== undefined || d.chatwoot_account_id !== undefined,
    { message: "Envía al menos chatwoot_user_id o chatwoot_account_id" },
  );

export type UpdateChatwootIdsInput = z.infer<typeof updateChatwootIdsSchema>;

export async function updateChatwootIds(data: UpdateChatwootIdsInput): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const row: Record<string, unknown> = {};
  if (data.chatwoot_user_id !== undefined) row["chatwoot_user_id"] = data.chatwoot_user_id;
  if (data.chatwoot_account_id !== undefined) row["chatwoot_account_id"] = data.chatwoot_account_id;

  const { data: updated, error } = await supabaseAdmin
    .from("users")
    .update(row as never)
    .eq("id", data.user_id)
    .select("id, chatwoot_user_id, chatwoot_account_id")
    .maybeSingle();

  if (error) {
    console.error("[users-chatwoot] update falló", { code: error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }
  if (!updated) {
    return json({ ok: false, error: "user_not_found" }, 404);
  }

  return json(
    {
      ok: true,
      user_id: updated.id,
      chatwoot_user_id: updated.chatwoot_user_id,
      chatwoot_account_id: updated.chatwoot_account_id,
    },
    200,
  );
}
