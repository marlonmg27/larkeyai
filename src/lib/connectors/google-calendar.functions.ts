import { createServerFn } from "@tanstack/react-start";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";

export const createNangoConnectSession = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    const { createConnectSession } = await import("./google-calendar.server");
    return createConnectSession({ userId: context.userId, email: context.email });
  });
