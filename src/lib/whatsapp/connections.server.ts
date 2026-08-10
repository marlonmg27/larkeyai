/**
 * Lógica compartida de los endpoints puente de `whatsapp_connections`.
 *
 * El backend FastAPI llama estos endpoints con `X-Internal-Secret` en vez de
 * manejar la service role key. Las credenciales de WhatsApp (display_name,
 * phone_number_id, waba_id, access_token) se aceptan en el body para no romper
 * el payload actual del backend, pero NUNCA se guardan ni se loguean.
 */
import { z } from "zod";

export const connectionStatuses = ["not_connected", "pending", "connected", "error"] as const;
export type ConnectionStatus = (typeof connectionStatuses)[number];

/** Campos que sí se persisten. El resto del payload se ignora. */
const persistedShape = {
  user_id: z.string().uuid(),
  status: z.enum(connectionStatuses),
  phone_display: z.string().trim().max(40).nullish(),
  chatwoot_inbox_id: z.string().trim().max(64).nullish(),
};

export const upsertConnectionSchema = z.object(persistedShape).passthrough();
export const patchConnectionSchema = z.object(persistedShape).passthrough();

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Devuelve una Response cuando la autenticación falla, o null si es válida. */
export function verifyInternalSecret(request: Request): Response | null {
  const expected = process.env["BACKEND_INTERNAL_SECRET"];
  if (!expected) {
    console.error("[whatsapp-connections] BACKEND_INTERNAL_SECRET sin configurar");
    return json({ ok: false, error: "server_not_configured" }, 500);
  }
  const provided = request.headers.get("x-internal-secret") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

export type ParsedBody<T> = { data: T } | { response: Response };

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParsedBody<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: json({ ok: false, error: "invalid_json" }, 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: json(
        { ok: false, error: "validation_error", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        400,
      ),
    };
  }
  return { data: parsed.data };
}

type PersistedFields = {
  user_id: string;
  status: ConnectionStatus;
  phone_display?: string | null;
  chatwoot_inbox_id?: string | null;
};

/** Solo los campos presentes; omitir un opcional no lo borra. */
function pickPresent(data: Record<string, unknown> & PersistedFields) {
  const row: Record<string, unknown> = { status: data.status };
  if (data.phone_display !== undefined) row["phone_display"] = data.phone_display;
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

export async function patchConnectionStatus(data: Record<string, unknown> & PersistedFields) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: updated, error } = await supabaseAdmin
    .from("whatsapp_connections")
    .update(pickPresent(data) as never)
    .eq("user_id", data.user_id)
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("[whatsapp-connections] update falló", { code: error.code });
    return json({ ok: false, error: "database_error" }, 500);
  }
  if (!updated) {
    return json({ ok: false, error: "connection_not_found" }, 404);
  }

  return json({ ok: true, user_id: data.user_id, status: data.status }, 200);
}
