import { createMiddleware } from "@tanstack/react-start";

import { verifyAccessToken } from "@/lib/auth/jwt.server";
import { readRequestAccessToken } from "@/lib/auth/session-cookie.server";

/**
 * Replaces requireSupabaseAuth. Verifies the backend HS256 JWT
 * (Authorization bearer or the httpOnly session cookie).
 */
export const requireBackendAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = readRequestAccessToken();
  if (!token) {
    throw new Error("Unauthorized: No authorization header provided");
  }

  const claims = await verifyAccessToken(token);
  return next({
    context: {
      userId: claims.sub,
      tenantId: claims.tenantId,
      email: claims.email,
      accessToken: token,
    },
  });
});
