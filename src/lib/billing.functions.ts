/**
 * Billing server functions — the ONLY surface React components import.
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

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createSubscriptionCheckout: create } = await import("@/lib/stripe/checkout.server");
    return create(supabaseAdmin, context.userId, data.planId);
  });

export const createPackCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => packIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createPackCheckout: create } = await import("@/lib/stripe/checkout.server");
    return create(supabaseAdmin, context.userId, data.packId);
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { cancelAtPeriodEnd } = await import("@/lib/stripe/subscriptions.server");
    await cancelAtPeriodEnd(supabaseAdmin, context.userId);
    return { ok: true };
  });

export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resumeSubscription: resume } = await import("@/lib/stripe/subscriptions.server");
    await resume(supabaseAdmin, context.userId);
    return { ok: true };
  });

export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { changePlan: change } = await import("@/lib/stripe/subscriptions.server");
    await change(supabaseAdmin, context.userId, data.planId);
    return { ok: true };
  });

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getStripe } = await import("@/lib/stripe/client.server");

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!user?.stripe_customer_id) return { invoices: [] as Array<{ id: string; amount: number; status: string | null; created: number; hosted_invoice_url: string | null }> };

    const list = await getStripe().invoices.list({ customer: user.stripe_customer_id, limit: 20 });
    return {
      invoices: list.data.map((inv) => ({
        id: inv.id!,
        amount: (inv.amount_paid ?? 0) / 100,
        status: inv.status,
        created: inv.created,
        hosted_invoice_url: inv.hosted_invoice_url,
      })),
    };
  });
