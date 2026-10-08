/**
 * Service-role dashboard billing reads for backend-auth sessions.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/auth/require-app-auth";

export const getDashboardBilling = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { backendAuthEnabled } = await import("@/lib/auth/backend.server");
    if (!backendAuthEnabled()) {
      throw new Error("Dashboard billing via service role requires BACKEND_AUTH_ENABLED.");
    }
    if (!context.tenantId) {
      throw new Error("Missing tenant_id on access token");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchDashboardBilling } = await import("@/lib/billing/dashboard.server");
    return fetchDashboardBilling(supabaseAdmin, {
      userId: context.userId,
      tenantId: context.tenantId,
    });
  });
