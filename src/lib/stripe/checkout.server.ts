/**
 * Stripe Checkout builders (server-only).
 *
 * FastAPI mapping:
 *   POST /internal/checkout/subscription { user_id, plan_id } -> { url }
 *   POST /internal/checkout/pack         { user_id, pack_id } -> { url }
 *
 * All state writes happen in the webhook via apply_subscription_event /
 * add_purchased_messages. These functions must NOT touch usage_balance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getStripe } from "./client.server";
import { getOrCreateCustomer } from "./customers.server";
import { siteUrl } from "./config.server";
import type { CheckoutResponse, CheckoutSessionMetadata } from "./contracts";

function checkoutMetadata(
  base: CheckoutSessionMetadata,
  tenantId?: string,
): Record<string, string> {
  const metadata: Record<string, string> = {
    user_id: base.user_id,
    kind: base.kind,
  };
  if (base.plan_id) metadata["plan_id"] = base.plan_id;
  if (base.pack_id) metadata["pack_id"] = base.pack_id;
  if (tenantId) {
    metadata["tenant_id"] = tenantId;
  } else if (base.tenant_id) {
    metadata["tenant_id"] = base.tenant_id;
  }
  return metadata;
}

export async function createSubscriptionCheckout(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  planId: string,
  opts?: { tenantId?: string; email?: string | null },
): Promise<CheckoutResponse> {
  const tenantId = opts?.tenantId;
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (!user && !tenantId) throw new Error("User not found");
  if (user && (user.subscription_status === "active" || user.subscription_status === "trialing")) {
    throw new Error("You already have an active subscription. Use change plan instead.");
  }

  const { data: plan, error: planErr } = await supabaseAdmin
    .from("plans")
    .select("id, stripe_price_id, trial_days, trial_requires_payment_method, active")
    .eq("id", planId)
    .maybeSingle();
  if (planErr) throw planErr;
  if (!plan || !plan.active) throw new Error("Plan not available");
  if (!plan.stripe_price_id) throw new Error("Plan has no Stripe price configured yet");

  const customerId = await getOrCreateCustomer(supabaseAdmin, userId, {
    tenantId,
    email: opts?.email,
  });
  const metadata = checkoutMetadata(
    { user_id: userId, kind: "subscription", plan_id: planId, ...(tenantId ? { tenant_id: tenantId } : {}) },
    tenantId,
  );

  const stripe = getStripe();
  const subscriptionMetadata: Record<string, string> = { user_id: userId, plan_id: planId };
  if (tenantId) subscriptionMetadata["tenant_id"] = tenantId;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    payment_method_collection: plan.trial_requires_payment_method ? "always" : "if_required",
    subscription_data: {
      trial_period_days: plan.trial_days ?? 14,
      metadata: subscriptionMetadata,
    },
    success_url: `${siteUrl()}/dashboard?checkout=success`,
    cancel_url: `${siteUrl()}/dashboard?checkout=cancel`,
    metadata,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

export async function createPackCheckout(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  packId: string,
  opts?: { tenantId?: string; email?: string | null },
): Promise<CheckoutResponse> {
  const tenantId = opts?.tenantId;

  if (!tenantId) {
    const { data: canBuy, error: rpcErr } = await supabaseAdmin.rpc("can_buy_pack", { p_user_id: userId });
    if (rpcErr) throw rpcErr;
    if (!canBuy) throw new Error("You need an active subscription to buy message packs.");
  }

  const { data: pack, error: packErr } = await supabaseAdmin
    .from("message_packs")
    .select("id, stripe_price_id, active")
    .eq("id", packId)
    .maybeSingle();
  if (packErr) throw packErr;
  if (!pack || !pack.active) throw new Error("Pack not available");
  if (!pack.stripe_price_id) throw new Error("Pack has no Stripe price configured yet");

  const customerId = await getOrCreateCustomer(supabaseAdmin, userId, {
    tenantId,
    email: opts?.email,
  });
  const metadata = checkoutMetadata(
    { user_id: userId, kind: "pack", pack_id: packId, ...(tenantId ? { tenant_id: tenantId } : {}) },
    tenantId,
  );

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: pack.stripe_price_id, quantity: 1 }],
    success_url: `${siteUrl()}/dashboard?checkout=success`,
    cancel_url: `${siteUrl()}/dashboard?checkout=cancel`,
    metadata,
    payment_intent_data: { metadata },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}
