/**
 * Picks Supabase Auth or backend JWT verification from BACKEND_AUTH_ENABLED.
 * Server functions should use this instead of requireSupabaseAuth directly.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { backendAuthEnabled } from "@/lib/auth/backend.server";
import { verifyBackendAccessToken } from "@/lib/auth/require-backend-auth";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function bearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Unauthorized: No authorization header provided");
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Only Bearer tokens are supported");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }
  if (token.split(".").length !== 3) {
    throw new Error("Unauthorized: Invalid token");
  }
  return token;
}

export const requireAppAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  if (!request?.headers) {
    throw new Error("Unauthorized: No request headers available");
  }

  const token = bearerToken(request);

  if (backendAuthEnabled()) {
    const claims = await verifyBackendAccessToken(token);
    return next({
      context: {
        userId: claims.sub,
        tenantId: claims.tenant_id,
        email: claims.email,
        accessToken: token,
        claims,
        supabase: null as ReturnType<typeof createClient<Database>> | null,
      },
    });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error("Unauthorized: Invalid token");
  }

  if (!data.claims.sub) {
    throw new Error("Unauthorized: No user ID found in token");
  }

  return next({
    context: {
      supabase,
      userId: data.claims.sub,
      tenantId: null as string | null,
      email: typeof data.claims.email === "string" ? data.claims.email : null,
      accessToken: token,
      claims: data.claims,
    },
  });
});
