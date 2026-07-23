/**
 * Webhook dispatcher (server-only).
 *
 * FastAPI mapping:
 *   POST /webhooks/stripe  (raw body, x-stripe-signature header)
 *
 * Idempotency: every event is persisted to stripe_events (PK = event.id).
 * A conflict short-circuits with success — safe to retry.
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getStripe } from "./client.server";
import type { CheckoutSessionMetadata } from "./contracts";

type Json = Database["public"]["Tables"]["stripe_events"]["Insert"]["payload"];

export type WebhookOutcome = { status: number; body: string };

/**
 * Some Stripe API versions expose `current_period_end` on the subscription
 * itself, others on the subscription item. Read whichever is available at
 * runtime — the SDK types don't cover every wire shape.
 */
function subscriptionPeriodEndIso(sub: Stripe.Subscription): string | undefined {
  const s = sub as unknown as { current_period_end?: number };
  if (typeof s.current_period_end === "number") return new Date(s.current_period_end * 1000).toISOString();
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  if (item && typeof item.current_period_end === "number") return new Date(item.current_period_end * 1000).toISOString();
  return undefined;
}

function iso(unixSeconds: number | null | undefined): string | undefined {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : undefined;
}

export async function verifyAndDispatch(
  supabaseAdmin: SupabaseClient<Database>,
  rawBody: string,
  signature: string | null,
): Promise<WebhookOutcome> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { status: 500, body: "webhook secret not configured" };
  if (!signature) return { status: 400, body: "missing signature" };

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return { status: 400, body: "invalid signature" };
  }

  const { error: insertErr } = await supabaseAdmin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type, payload: JSON.parse(JSON.stringify(event)) as Json });
  if (insertErr) {
    if ((insertErr as { code?: string }).code === "23505") return { status: 200, body: "duplicate" };
    console.error("[stripe-webhook] failed to persist event", insertErr);
    return { status: 500, body: "persist failed" };
  }

  try {
    await handleEvent(supabaseAdmin, event);
    return { status: 200, body: "ok" };
  } catch (err) {
    console.error("[stripe-webhook] handler failed", event.type, err);
    await supabaseAdmin.from("stripe_events").delete().eq("id", event.id);
    return { status: 500, body: "handler failed" };
  }
}

async function handleEvent(supabaseAdmin: SupabaseClient<Database>, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(supabaseAdmin, event.data.object as Stripe.Checkout.Session);
    case "customer.subscription.updated":
      return handleSubscriptionUpdated(supabaseAdmin, event.data.object as Stripe.Subscription);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(supabaseAdmin, event.data.object as Stripe.Subscription);
    case "invoice.paid":
      return handleInvoicePaid(supabaseAdmin, event.data.object as Stripe.Invoice);
    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(supabaseAdmin, event.data.object as Stripe.Invoice);
    default:
      return;
  }
}

function readMetadata(md: Stripe.Metadata | null | undefined): Partial<CheckoutSessionMetadata> {
  if (!md) return {};
  return md as unknown as Partial<CheckoutSessionMetadata>;
}

async function userIdFromCustomer(
  supabaseAdmin: SupabaseClient<Database>,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function callApplySubscription(
  supabaseAdmin: SupabaseClient<Database>,
  params: {
    userId: string;
    action: string;
    planId?: string;
    stripeCustomerId?: string;
    subscriptionId?: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  },
) {
  const { error } = await supabaseAdmin.rpc("apply_subscription_event", {
    p_user_id: params.userId,
    p_action: params.action,
    p_plan_id: params.planId,
    p_stripe_customer_id: params.stripeCustomerId,
    p_subscription_id: params.subscriptionId,
    p_trial_ends_at: params.trialEndsAt,
    p_current_period_end: params.currentPeriodEnd,
    p_cancel_at_period_end: params.cancelAtPeriodEnd,
  });
  if (error) throw error;
}

async function handleCheckoutCompleted(
  supabaseAdmin: SupabaseClient<Database>,
  session: Stripe.Checkout.Session,
) {
  const md = readMetadata(session.metadata);
  const userId = md.user_id ?? (await userIdFromCustomer(supabaseAdmin, session.customer));
  if (!userId) throw new Error("Cannot resolve user for checkout session");

  if (session.mode === "subscription" && md.kind === "subscription" && md.plan_id) {
    const stripe = getStripe();
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
    if (!subscriptionId) throw new Error("Subscription id missing");
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const action = sub.status === "trialing" ? "trial_started" : "activated";

    await callApplySubscription(supabaseAdmin, {
      userId,
      action,
      planId: md.plan_id,
      stripeCustomerId: customerId,
      subscriptionId: sub.id,
      trialEndsAt: iso(sub.trial_end),
      currentPeriodEnd: subscriptionPeriodEndIso(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
    return;
  }

  if (session.mode === "payment" && md.kind === "pack" && md.pack_id) {
    const { data: pack, error: packErr } = await supabaseAdmin
      .from("message_packs")
      .select("code, messages")
      .eq("id", md.pack_id)
      .maybeSingle();
    if (packErr) throw packErr;
    if (!pack) throw new Error("Pack not found for id " + md.pack_id);

    const amount = (session.amount_total ?? 0) / 100;

    const { error } = await supabaseAdmin.rpc("add_purchased_messages", {
      p_user_id: userId,
      p_messages: pack.messages,
      p_package: pack.code,
      p_amount: amount,
      p_stripe_payment_id: session.id,
    });
    if (error) throw error;

    await supabaseAdmin
      .from("purchases")
      .update({ pack_id: md.pack_id, stripe_session_id: session.id })
      .eq("stripe_payment_id", session.id);
  }
}

async function handleSubscriptionUpdated(
  supabaseAdmin: SupabaseClient<Database>,
  sub: Stripe.Subscription,
) {
  const userId = await userIdFromCustomer(supabaseAdmin, sub.customer);
  if (!userId) throw new Error("Cannot resolve user for subscription " + sub.id);

  const planIdMeta = sub.metadata?.plan_id as string | undefined;
  let action = "updated";
  if (sub.status === "active") action = "activated";
  else if (sub.status === "trialing") action = "trial_started";
  else if (sub.status === "past_due") action = "past_due";
  else if (sub.status === "canceled" || sub.status === "unpaid") action = "canceled";

  await callApplySubscription(supabaseAdmin, {
    userId,
    action,
    planId: planIdMeta,
    subscriptionId: sub.id,
    trialEndsAt: iso(sub.trial_end),
    currentPeriodEnd: subscriptionPeriodEndIso(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(
  supabaseAdmin: SupabaseClient<Database>,
  sub: Stripe.Subscription,
) {
  const userId = await userIdFromCustomer(supabaseAdmin, sub.customer);
  if (!userId) return;
  await callApplySubscription(supabaseAdmin, {
    userId,
    action: "canceled",
    subscriptionId: sub.id,
  });
}

async function handleInvoicePaid(
  supabaseAdmin: SupabaseClient<Database>,
  invoice: Stripe.Invoice,
) {
  const subRef = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
  if (!subRef) return;
  if (invoice.billing_reason !== "subscription_cycle") return;

  const userId = await userIdFromCustomer(supabaseAdmin, invoice.customer);
  if (!userId) return;

  const stripe = getStripe();
  const subscriptionId = typeof subRef === "string" ? subRef : subRef.id;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const planIdMeta = sub.metadata?.plan_id as string | undefined;

  await callApplySubscription(supabaseAdmin, {
    userId,
    action: "renewed",
    planId: planIdMeta,
    subscriptionId: sub.id,
    currentPeriodEnd: subscriptionPeriodEndIso(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

async function handleInvoicePaymentFailed(
  supabaseAdmin: SupabaseClient<Database>,
  invoice: Stripe.Invoice,
) {
  const userId = await userIdFromCustomer(supabaseAdmin, invoice.customer);
  if (!userId) return;
  await callApplySubscription(supabaseAdmin, {
    userId,
    action: "past_due",
  });
}
