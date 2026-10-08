/**
 * Server functions del paso 1 del onboarding.
 * El tenant ya existe desde el registro. El token sale del JWT verificado.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";
import { chatwootAccountSchema } from "@/lib/chatwoot/schema";

export const createChatwootAccountForUser = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .inputValidator((data: unknown) => chatwootAccountSchema.parse(data))
  .handler(async ({ context }) => {
    const { createChatwootAccount } = await import("@/lib/chatwoot/account.server");
    return createChatwootAccount(context.accessToken);
  });
