/**
 * Resuelve el número de WhatsApp del usuario autenticado.
 * Usa el cliente con RLS del middleware, nunca el service role.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function resolveUserPhoneNumber(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("whatsapp_connections")
    .select("phone_number")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[agent-instructions] no se pudo leer whatsapp_connections", {
      code: error.code,
    });
    throw new Error("No pudimos leer tu conexión de WhatsApp.");
  }

  const phone = data?.phone_number?.trim();
  return phone && phone.length > 0 ? phone : null;
}
