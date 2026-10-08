import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  BACKEND_AUTH_EVENT,
  getBackendSession,
  type BackendAuthUser,
} from "@/lib/auth/session";

export type AuthUser = Pick<User, "id" | "email"> & {
  tenantId?: string;
  tenantSlug?: string;
};

function toAuthUser(user: BackendAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug,
  };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function applyBackend() {
      const backend = getBackendSession();
      if (backend) {
        setSession(null);
        setUser(toAuthUser(backend.user));
        setLoading(false);
        return true;
      }
      return false;
    }

    if (applyBackend()) {
      const onBackend = () => {
        if (!applyBackend()) {
          setUser(null);
          setSession(null);
        }
      };
      window.addEventListener(BACKEND_AUTH_EVENT, onBackend);
      return () => window.removeEventListener(BACKEND_AUTH_EVENT, onBackend);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (getBackendSession()) {
        applyBackend();
        return;
      }
      setSession(s);
      setUser(s?.user ? { id: s.user.id, email: s.user.email } : null);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (getBackendSession()) {
        applyBackend();
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
      setLoading(false);
    });

    const onBackend = () => {
      if (applyBackend()) return;
    };
    window.addEventListener(BACKEND_AUTH_EVENT, onBackend);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener(BACKEND_AUTH_EVENT, onBackend);
    };
  }, []);

  return { session, user, loading };
}
