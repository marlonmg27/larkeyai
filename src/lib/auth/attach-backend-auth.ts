import { createMiddleware } from "@tanstack/react-start";

import { getAccessToken } from "@/lib/auth/token";

/** Attaches the stored access token to server function calls. */
export const attachBackendAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = getAccessToken();
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
