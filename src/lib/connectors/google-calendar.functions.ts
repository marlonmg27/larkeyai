import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function requestOrigin(): string {
  const request = getRequest();
  if (!request) throw new Error("La conexión debe iniciarse desde una petición de la app.");
  const url = new URL(request.url);
  const sandboxHost =
    url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
}

export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { startConnect } = await import("./google-calendar.server");
    return startConnect(context.userId, requestOrigin());
  });

export const completeGoogleCalendarConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => z.object({ code: z.string().min(1).max(2048) }).parse(input))
  .handler(async ({ data, context }) => {
    const { completeConnection } = await import("./google-calendar.server");
    return completeConnection(context.userId, data.code);
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
