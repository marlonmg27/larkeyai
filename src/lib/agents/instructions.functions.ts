/**
 * Server functions de las instrucciones del agente.
 * El teléfono se lee del backend, nunca de Supabase.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";

const updateSchema = z.object({
  instructions: z.string().max(8000),
});

export const fetchAgentInstructions = createServerFn({ method: "GET" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    const { resolveUserPhoneNumber } = await import("@/lib/agents/phone.server");
    const phoneNumber = await resolveUserPhoneNumber(context.accessToken);
    if (!phoneNumber) {
      return { phoneNumber: null, instructions: "" };
    }
    const { getInstructions } = await import("@/lib/agents/instructions.server");
    return { phoneNumber, instructions: await getInstructions(phoneNumber) };
  });

export const updateAgentInstructions = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { resolveUserPhoneNumber } = await import("@/lib/agents/phone.server");
    const phoneNumber = await resolveUserPhoneNumber(context.accessToken);
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
