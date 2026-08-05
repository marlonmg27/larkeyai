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
    const { connectWhatsApp } = await import("@/lib/whatsapp/onboarding.server");
    return connectWhatsApp({
      userId: context.userId,
      displayName: data.displayName,
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      accessToken: data.accessToken,
    });
  });
