/**
 * Login / register server functions against jira when BACKEND_AUTH_ENABLED is on.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenant_id: z.string().uuid().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  tenant_name: z.string().trim().min(1).max(150),
  phone_number: z
    .string()
    .regex(/^\+[1-9][0-9]{7,14}$/)
    .optional(),
  timezone: z.string().max(64).optional(),
  locale: z.string().max(10).optional(),
});

export const getBackendAuthEnabled = createServerFn({ method: "GET" }).handler(async () => {
  const { backendAuthEnabled } = await import("@/lib/auth/backend.server");
  return { enabled: backendAuthEnabled() };
});

export const loginWithBackend = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { backendAuthEnabled, backendLogin } = await import("@/lib/auth/backend.server");
    if (!backendAuthEnabled()) {
      throw new Error("Backend auth is not enabled.");
    }
    return backendLogin(data);
  });

export const registerWithBackend = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const { backendAuthEnabled, backendRegister } = await import("@/lib/auth/backend.server");
    if (!backendAuthEnabled()) {
      throw new Error("Backend auth is not enabled.");
    }
    return backendRegister({
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      tenant_name: data.tenant_name,
      ...(data.phone_number ? { phone_number: data.phone_number } : {}),
      ...(data.timezone ? { timezone: data.timezone } : {}),
      ...(data.locale ? { locale: data.locale } : {}),
    });
  });
