/**
 * Verifies the HS256 access tokens issued by the Larkey backend.
 * Claims: sub (user id), tenant_id, email. Secret: AUTH_JWT_SECRET.
 */
export type AccessClaims = {
  sub: string;
  tenantId: string;
  email: string;
  exp: number | null;
};

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const secret = process.env["AUTH_JWT_SECRET"];
  if (!secret) {
    console.error("[auth] AUTH_JWT_SECRET sin configurar");
    throw new Error("Unauthorized: Auth is not configured");
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new Error("Unauthorized: Invalid token");
  }

  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];
  let header: { alg?: unknown };
  try {
    header = JSON.parse(decodeBase64Url(headerPart)) as { alg?: unknown };
  } catch {
    throw new Error("Unauthorized: Invalid token");
  }
  if (header.alg !== "HS256") {
    throw new Error("Unauthorized: Invalid token");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    bytesFromString(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signaturePart),
    bytesFromString(`${headerPart}.${payloadPart}`),
  );
  if (!valid) {
    throw new Error("Unauthorized: Invalid token");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(decodeBase64Url(payloadPart)) as Record<string, unknown>;
  } catch {
    throw new Error("Unauthorized: Invalid token");
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload["exp"] === "number" ? payload["exp"] : null;
  const nbf = typeof payload["nbf"] === "number" ? payload["nbf"] : null;
  if (exp != null && now >= exp) {
    throw new Error("Unauthorized: Token expired");
  }
  if (nbf != null && now < nbf) {
    throw new Error("Unauthorized: Token not yet valid");
  }

  const sub = payload["sub"];
  const tenantId = payload["tenant_id"];
  const email = payload["email"];
  if (typeof sub !== "string" || typeof tenantId !== "string" || typeof email !== "string") {
    throw new Error("Unauthorized: Token missing required claims");
  }
  if (!sub || !tenantId || !email) {
    throw new Error("Unauthorized: Token missing required claims");
  }

  return { sub, tenantId, email, exp };
}

export function tokenMaxAgeSeconds(token: string): number {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return 60 * 60 * 24 * 7;
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as { exp?: unknown };
    if (typeof payload.exp === "number") {
      const seconds = Math.floor(payload.exp - Date.now() / 1000);
      if (seconds > 60) return seconds;
    }
  } catch {
    // Fall through to the default lifetime.
  }
  return 60 * 60 * 24 * 7;
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function bytesFromString(value: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(value);
  const buffer = new ArrayBuffer(encoded.byteLength);
  const copy = new Uint8Array(buffer);
  copy.set(encoded);
  return copy;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
