/**
 * Subscription lifecycle actions (server-only).
 *
 * FastAPI mapping:
 *   POST /internal/subscriptions/cancel  { user_id }
 *   POST /internal/subscriptions/resume  { user_id }
 *   POST /internal/subscriptions/change  { user_id, plan_id }
 *
 * All resulting state changes are delivered back through the webhook
 * (customer.subscription.updated).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getStripe } from "./client.server";

async function loadSubscription(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("subscription_id, subscription_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.subscription_id) throw new Error("No active subscription");
  return data;
}

export async function cancelAtPeriodEnd(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { subscription_id } = await loadSubscription(supabaseAdmin, userId);
  await getStripe().subscriptions.update(subscription_id!, { cancel_at_period_end: true });
}

export async function resumeSubscription(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { subscription_id } = await loadSubscription(supabaseAdmin, userId);
  await getStripe().subscriptions.update(subscription_id!, { cancel_at_period_end: false });
}

export async function changePlan(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  newPlanId: string,
): Promise<void> {
  const { subscription_id } = await loadSubscription(supabaseAdmin, userId);

  const { data: plan, error: planErr } = await supabaseAdmin
    .from("plans")
    .select("stripe_price_id, active")
    .eq("id", newPlanId)
    .maybeSingle();
  if (planErr) throw planErr;
  if (!plan?.active || !plan.stripe_price_id) throw new Error("Target plan not available");

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscription_id!);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) throw new Error("Subscription has no line items");

  await stripe.subscriptions.update(subscription_id!, {
    items: [{ id: itemId, price: plan.stripe_price_id }],
    proration_behavior: "create_prorations",
    metadata: { ...(sub.metadata ?? {}), plan_id: newPlanId },
  });
}
