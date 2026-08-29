/**
 * Server functions de las instrucciones del agente.
 * El user_id y el phone_number SIEMPRE se resuelven en el servidor.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const updateSchema = z.object({
  instructions: z.string().max(8000),
});

export const fetchAgentInstructions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveUserPhoneNumber } = await import("@/lib/agents/phone.server");
    const phoneNumber = await resolveUserPhoneNumber(context.supabase, context.userId);
    if (!phoneNumber) {
      return { phoneNumber: null, instructions: "" };
    }
    const { getInstructions } = await import("@/lib/agents/instructions.server");
    return { phoneNumber, instructions: await getInstructions(phoneNumber) };
  });

export const updateAgentInstructions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { resolveUserPhoneNumber } = await import("@/lib/agents/phone.server");
    const phoneNumber = await resolveUserPhoneNumber(context.supabase, context.userId);
    if (!phoneNumber) {
      throw new Error("Todavía no tienes un canal de WhatsApp conectado.");
    }
    const { saveInstructions } = await import("@/lib/agents/instructions.server");
    const instructions = await saveInstructions({
      phoneNumber,
      instructions: data.instructions,
      userId: context.userId,
    });
    return { phoneNumber, instructions };
  });
