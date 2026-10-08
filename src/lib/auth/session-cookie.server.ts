import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "larkey_access_token";

export function readRequestAccessToken(): string | null {
  const request = getRequest();
  const header = request?.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  const cookie = getCookie(COOKIE_NAME);
  return cookie && cookie.length > 0 ? cookie : null;
}

export function writeSessionCookie(token: string, maxAge: number): void {
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(): void {
  deleteCookie(COOKIE_NAME, { path: "/" });
}
