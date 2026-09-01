/**
 * Lógica compartida de los endpoints puente de `whatsapp_connections`.
 *
 * El backend FastAPI llama estos endpoints con `X-Internal-Secret` en vez de
 * manejar la service role key. Las credenciales de WhatsApp (display_name,
 * phone_number_id, waba_id, access_token) se aceptan en el body para no romper
 * el payload actual del backend, pero NUNCA se guardan ni se loguean.
 */
import { z } from "zod";
import { json, parseBody, verifyInternalSecret } from "@/lib/api/internal.server";

// Re-exportados para no romper imports existentes.
export { json, parseBody, verifyInternalSecret };
export type { ParsedBody } from "@/lib/api/internal.server";

export const connectionStatuses = ["not_connected", "pending", "connected", "error"] as const;
export type ConnectionStatus = (typeof connectionStatuses)[number];

/** Campos que sí se persisten. El resto del payload se ignora. */
const persistedShape = {
  user_id: z.string().uuid(),
  status: z.enum(connectionStatuses),
  phone_number: z.string().trim().max(40).nullish(),
  chatwoot_inbox_id: z.string().trim().max(64).nullish(),
};

export const upsertConnectionSchema = z.object(persistedShape).passthrough();
export const patchConnectionSchema = z.object(persistedShape).passthrough();

export const findByPhoneSchema = z.object({
  phone_number: z.string().trim().min(5).max(40),
});

type PersistedFields = {
  user_id: string;
  status: ConnectionStatus;
  phone_number?: string | null;
  chatwoot_inbox_id?: string | null;
};

/** Solo los campos presentes; omitir un opcional no lo borra. */
function pickPresent(data: Record<string, unknown> & PersistedFields) {
  const row: Record<string, unknown> = { status: data.status };
  if (data.phone_number !== undefined) row["phone_number"] = data.phone_number;
  if (data.chatwoot_inbox_id !== undefined) row["chatwoot_inbox_id"] = data.chatwoot_inbox_id;
  return row;
}

export async function upsertConnection(data: Record<string, unknown> & PersistedFields) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const existing = await supabaseAdmin
    .from("whatsapp_connections")
    .select("id")
    .eq("user_id", data.user_id)
    .maybeSingle();

  if (existing.error) {
    console.error("[whatsapp-connections] select falló", { code: existing.error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }

  const { error } = await supabaseAdmin
    .from("whatsapp_connections")
    .upsert(
      { user_id: data.user_id, ...pickPresent(data) } as never,
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[whatsapp-connections] upsert falló", { code: error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }

  return json(
    { ok: true, user_id: data.user_id, status: data.status, created: existing.data === null },
    200,
  );
}

/**
 * Idempotente: actualiza la fila si existe, la crea si no.
 * Ya no devuelve `connection_not_found`.
 */
export async function patchConnectionStatus(data: Record<string, unknown> & PersistedFields) {
  return upsertConnection(data);
}

const CONNECTION_COLUMNS =
  "id, id_int, user_id, user_id_int, status, phone_number, chatwoot_inbox_id, chatwoot_account_id, chatwoot_user_id, waba_id, waba_name, updated_at";

/** Solo dígitos, para tolerar formatos con espacios, guiones o paréntesis. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Busca la conexión por `phone_number`: primero match exacto, luego comparando
 * solo dígitos (así `+52 662 000 0000` encuentra `+526620000000`).
 */
export async function findConnectionByPhone(phoneNumber: string): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const exact = await supabaseAdmin
    .from("whatsapp_connections")
    .select(CONNECTION_COLUMNS)
    .eq("phone_number", phoneNumber)
    .limit(1)
    .maybeSingle();

  if (exact.error) {
    console.error("[whatsapp-connections] búsqueda exacta falló", { code: exact.error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }
  if (exact.data) {
    return json({ ok: true, connection: exact.data }, 200);
  }

  const digits = digitsOnly(phoneNumber);
  if (digits.length === 0) {
    return json({ ok: false, error: "connection_not_found" }, 404);
  }

  // Fallback normalizado: se filtra en memoria sobre las filas con teléfono.
  const all = await supabaseAdmin
    .from("whatsapp_connections")
    .select(CONNECTION_COLUMNS)
    .not("phone_number", "is", null);

  if (all.error) {
    console.error("[whatsapp-connections] búsqueda normalizada falló", { code: all.error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }

  const match = (all.data ?? []).find(
    (row) => digitsOnly(row.phone_number ?? "") === digits,
  );

  if (!match) {
    return json({ ok: false, error: "connection_not_found" }, 404);
  }

  return json({ ok: true, connection: match }, 200);
}
