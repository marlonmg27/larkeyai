/**
 * Pure date helpers shared across the payments module.
 * No runtime dependencies, so it can be imported from anywhere.
 */
import type Stripe from "stripe";

export function iso(unixSeconds: number | null | undefined): string | undefined {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : undefined;
}

/**
 * Some Stripe API versions expose `current_period_end` on the subscription
 * itself, others on the subscription item. Read whichever is available at
 * runtime — the SDK types don't cover every wire shape.
 */
export function subscriptionPeriodEndIso(sub: Stripe.Subscription): string | undefined {
  const s = sub as unknown as { current_period_end?: number };
  if (typeof s.current_period_end === "number") return new Date(s.current_period_end * 1000).toISOString();
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  if (item && typeof item.current_period_end === "number") return new Date(item.current_period_end * 1000).toISOString();
  return undefined;
}
