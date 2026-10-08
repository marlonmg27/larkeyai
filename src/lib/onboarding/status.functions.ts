/**
 * Server function the dashboard polls. The user id comes from the verified JWT.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "@/lib/auth/require-app-auth";

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { fetchOnboardingStatus } = await import("@/lib/onboarding/status.server");
    return fetchOnboardingStatus(context.userId, {
      accessToken: context.accessToken,
      tenantId: context.tenantId ?? undefined,
    });
  });
