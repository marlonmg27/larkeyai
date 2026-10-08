import { supabase } from "@/integrations/supabase/client";
import { clearBackendSession, hasBackendSession } from "@/lib/auth/session";

/** Clears backend JWT and/or Supabase session. */
export async function signOutApp(): Promise<void> {
  if (hasBackendSession()) {
    clearBackendSession();
  }
  await supabase.auth.signOut();
}
