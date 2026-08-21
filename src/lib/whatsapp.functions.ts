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
      };
    }



    const { connectWhatsApp } = await import("@/lib/whatsapp/onboarding.server");
    const result = await connectWhatsApp({
      userId: context.userId,
      channel: data.channel,
      displayName: data.displayName,
      userName: data.userName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      accessToken: data.accessToken,
    });


    return { ...result, verification: null };
  });
