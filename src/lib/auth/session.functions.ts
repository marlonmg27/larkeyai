import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { AuthUser } from "@/lib/auth/token";

const phoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const compact = value.replace(/[\s()-]/g, "");
    const e164 = compact.startsWith("+") ? compact : `+${compact.replace(/^\+/, "")}`;
    if (!/^\+[1-9][0-9]{7,14}$/.test(e164)) {
      throw new Error("Usa el teléfono con código de país, por ejemplo +526620000000.");
    }
    return e164;
  });

const loginInput = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const registerInput = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  tenantName: z.string().trim().min(1).max(150),
  phoneNumber: phoneSchema,
});

export type { AuthUser };

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginInput.parse(data))
  .handler(async ({ data }) => {
    const { loginWithBackend } = await import("@/lib/auth/session.server");
    return loginWithBackend(data);
  });

export const register = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerInput.parse(data))
  .handler(async ({ data }) => {
    const { registerWithBackend } = await import("@/lib/auth/session.server");
    return registerWithBackend(data);
  });

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { readVerifiedSession } = await import("@/lib/auth/session.server");
  return readVerifiedSession();
});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { endSession } = await import("@/lib/auth/session.server");
  endSession();
  return { ok: true as const };
});
