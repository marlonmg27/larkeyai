/**
 * Server functions del paso 1 del onboarding.
 * El user_id SIEMPRE viene del JWT verificado, nunca del body.
 * La contraseña no se envía: la define el backend.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatwootAccountSchema } from "@/lib/chatwoot/schema";

export const createChatwootAccountForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => chatwootAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { createChatwootAccount } = await import("@/lib/chatwoot/account.server");
    return createChatwootAccount({
      userId: context.userId,
      email: data.email,
      name: data.name,
      companyName: data.companyName,
    });
  });
