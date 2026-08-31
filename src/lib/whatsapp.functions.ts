/**
 * Server functions de WhatsApp — única superficie que importa el frontend.
 * El user_id SIEMPRE viene del JWT verificado, nunca del body.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { whatsappOnboardingSchema } from "@/lib/whatsapp/schema";

export const connectWhatsAppAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => whatsappOnboardingSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Los IDs de la plataforma de conversaciones se resuelven en el servidor:
    // nunca se confían al navegador ni se capturan en el formulario.
    const { data: userRow, error } = await context.supabase
      .from("users")
      .select("chatwoot_user_id, chatwoot_account_id")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) {
      console.error("[whatsapp-onboarding] no se pudo leer users", { reason: error.message });
      throw new Error("No pudimos leer tu cuenta. Inténtalo de nuevo.");
    }

    const chatwootUserId = userRow?.chatwoot_user_id ?? null;
    const chatwootAccountId = userRow?.chatwoot_account_id ?? null;

    if (chatwootUserId == null || chatwootAccountId == null) {
      return {
        ok: false as const,
        verification: null,
        status: null,
        message:
          "Primero crea tu cuenta de la plataforma de conversaciones para poder conectar WhatsApp.",
        accountMissing: true as const,
      };
    }

    // Verificación con Graph API activa: se valida contra Meta antes de tocar el backend.
    const { verifyPhoneBelongsToWaba } = await import("@/lib/whatsapp/graph.server");

    const verification = await verifyPhoneBelongsToWaba({
      wabaId: data.wabaId,
      phoneNumberId: data.phoneNumberId,
      phoneNumber: data.phoneNumber,
      accessToken: data.accessToken,
    });

    if (!verification.ok) {
      return {
        ok: false as const,
        verification: { field: verification.field, message: verification.message },
        status: null,
        message: null,
        accountMissing: false as const,
      };
    }

    const { connectWhatsApp } = await import("@/lib/whatsapp/onboarding.server");
    const result = await connectWhatsApp({
      userId: context.userId,
      channel: data.channel,
      displayName: data.displayName,
      userName: data.userName,
      phoneNumber: data.phoneNumber,
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      chatwootUserId,
      chatwootAccountId,
      accessToken: data.accessToken,
    });

    return { ...result, verification: null, accountMissing: false as const };
  });
