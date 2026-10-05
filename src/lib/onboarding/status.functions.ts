/**
 * Server function the dashboard polls. The user id comes from the verified JWT.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { fetchOnboardingStatus } = await import("@/lib/onboarding/status.server");
    return fetchOnboardingStatus(context.userId);
  });
