/**
 * Server function the dashboard polls. The caller comes from the verified JWT.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    const { fetchOnboardingStatus } = await import("@/lib/onboarding/status.server");
    return fetchOnboardingStatus(context.accessToken);
  });
