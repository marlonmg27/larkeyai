import { useEffect, useState } from "react";

import { getSession } from "@/lib/auth/session.functions";
import { onAuthChange, type AuthUser } from "@/lib/auth/token";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const session = await getSession();
        if (!cancelled) setUser(session);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const stop = onAuthChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return { user, loading };
}
