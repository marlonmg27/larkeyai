/**
 * Verifies the backend HS256 JWT (AUTH_JWT_SECRET) on server functions.
 * Claims: sub = users.id, tenant_id, email.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { jwtVerify } from "jose";

export type BackendAuthClaims = {
  sub: string;
  tenant_id: string;
  email: string;
};

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

export async function verifyBackendAccessToken(token: string): Promise<BackendAuthClaims> {
  const secret = process.env["AUTH_JWT_SECRET"];
  if (!secret) {
    console.error("[backend-auth] AUTH_JWT_SECRET is not configured");
    throw new Error("Unauthorized: Auth is not configured");
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    const sub = payload.sub;
    const tenantId = payload["tenant_id"];
    const email = payload["email"];
    if (typeof sub !== "string" || !sub) {
      throw new Error("Unauthorized: No user ID found in token");
    }
    if (typeof tenantId !== "string" || !tenantId) {
      throw new Error("Unauthorized: No tenant ID found in token");
    }
    if (typeof email !== "string" || !email) {
      throw new Error("Unauthorized: No email found in token");
    }
    return { sub, tenant_id: tenantId, email };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unauthorized:")) throw err;
    throw new Error("Unauthorized: Invalid token");
  }
}

export const requireBackendAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const token = bearerToken(request);
    const claims = await verifyBackendAccessToken(token);

    return next({
      context: {
        userId: claims.sub,
        tenantId: claims.tenant_id,
        email: claims.email,
        accessToken: token,
        claims,
        supabase: null,
      },
    });
  },
);
