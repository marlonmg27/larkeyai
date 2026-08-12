/**
 * Server function del Embedded Signup de WhatsApp.
 * El `user_id` SIEMPRE sale del JWT verificado, nunca del body.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  code: z.string().trim().nonempty().max(512),
  wabaId: z.string().trim().max(64).optional(),
  phoneNumberId: z.string().trim().max(64).optional(),
});

export const completeEmbeddedSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Mientras la app de Meta no esté aprobada como Tech Provider el flujo queda
    // inactivo: no se contacta al backend. Basta con quitar este bloque (o
    // activar el flag del cliente) cuando la revisión pase.
    if (process.env["WHATSAPP_EMBEDDED_SIGNUP_ENABLED"] !== "true") {
      return {
        ok: false as const,
        reason: "disabled" as const,
        status: null,
        message:
          "La conexión automática con WhatsApp Business todavía está en revisión por Meta.",
      };
    }

    const { forwardEmbeddedSignup } = await import("@/lib/whatsapp/embedded-signup.server");
    const result = await forwardEmbeddedSignup({
      userId: context.userId,
      code: data.code,
      wabaId: data.wabaId,
      phoneNumberId: data.phoneNumberId,
    });

    return { ...result, reason: null };
  });
