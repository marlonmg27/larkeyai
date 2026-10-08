/**
 * Server functions de WhatsApp — única superficie que importa el frontend.
 * El tenant sale del JWT verificado, nunca del body.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";
import { whatsappOnboardingSchema } from "@/lib/whatsapp/schema";

export const connectWhatsAppAccount = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .inputValidator((data: unknown) => whatsappOnboardingSchema.parse(data))
  .handler(async ({ data, context }) => {
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
      token: context.accessToken,
      wabaName: data.wabaName,
      phoneNumber: data.phoneNumber,
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      accessToken: data.accessToken,
    });
    return { ...result, verification: null, accountMissing: false as const };
  });
