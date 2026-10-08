import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getBackendSession } from "@/lib/auth/session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const backend = getBackendSession();
    if (backend) {
      return {
        user: {
          id: backend.user.id,
          email: backend.user.email,
          tenantId: backend.user.tenantId,
          tenantSlug: backend.user.tenantSlug,
        },
      };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
