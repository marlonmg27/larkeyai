import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/auth/require-app-auth";

export const createNangoConnectSession = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { createConnectSession } = await import("./google-calendar.server");
    return createConnectSession(context.userId);
  });
