import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createNangoConnectSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { createConnectSession } = await import("./google-calendar.server");
    return createConnectSession(context.userId);
  });

export const listGoogleCalendarEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listUpcoming } = await import("./google-calendar.server");
    return listUpcoming(context.userId);
  });

export const createGoogleCalendarTestEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { createTestEvent } = await import("./google-calendar.server");
    return createTestEvent(context.userId);
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnect } = await import("./google-calendar.server");
    return disconnect(context.userId);
  });
