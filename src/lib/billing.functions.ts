/**
 * Billing server functions — the ONLY surface React components import.
 *
 * This file is a thin bridge: it authenticates the caller, validates input and
 * delegates to the payments module facade (@/lib/stripe/index.server).
 *
 * Migration to FastAPI: replace each handler body with a fetch() to the
 * corresponding microservice endpoint (see src/lib/stripe/README.md).
 * The input/output shapes are locked so the React layer never changes.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const planIdInput = z.object({ planId: z.string().uuid() });
const packIdInput = z.object({ packId: z.string().uuid() });

/** Loads the privileged Supabase client and the payments facade together. */
async function serverDeps() {
  const [{ supabaseAdmin }, payments] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/lib/stripe/index.server"),
  ]);
  return { supabaseAdmin, payments };
}

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, payments } = await serverDeps();
    return payments.createSubscriptionCheckout(supabaseAdmin, context.userId, data.planId);
  });

export const createPackCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => packIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, payments } = await serverDeps();
    return payments.createPackCheckout(supabaseAdmin, context.userId, data.packId);
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin, payments } = await serverDeps();
    await payments.cancelAtPeriodEnd(supabaseAdmin, context.userId);
    return { ok: true as const };
  });

export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin, payments } = await serverDeps();
    await payments.resumeSubscription(supabaseAdmin, context.userId);
    return { ok: true as const };
  });

export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, payments } = await serverDeps();
    await payments.changePlan(supabaseAdmin, context.userId, data.planId);
    return { ok: true as const };
  });

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin, payments } = await serverDeps();
    return payments.listInvoices(supabaseAdmin, context.userId);
  });
