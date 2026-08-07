/**
 * DTOs and constants shared between the TS billing layer and the future
 * FastAPI microservice. Keep this file free of runtime dependencies so it
 * can be trivially ported.
 */

export type CheckoutSessionMetadata = {
  /** Supabase auth user id. Always present. */
  user_id: string;
  /** 'subscription' | 'pack' — disambiguates the completed webhook path. */
  kind: "subscription" | "pack";
  /** plans.id (for kind='subscription'). */
  plan_id?: string;
  /** message_packs.id (for kind='pack'). */
  pack_id?: string;
};

export type CreateSubscriptionCheckoutInput = { planId: string };
export type CreatePackCheckoutInput = { packId: string };
export type CheckoutResponse = { url: string };

export type SubscriptionAction =
  | "trial_started"
  | "activated"
  | "renewed"
  | "past_due"
  | "canceled"
  | "updated";

/**
 * Stripe event types this backend understands. Any other event is stored
 * in stripe_events for audit but produces no state change.
 */
export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

export type HandledStripeEventType = (typeof HANDLED_STRIPE_EVENTS)[number];

/**
 * Payload forwarded to the Python backend at
 * POST ${BACKEND_URL}/webhooks/subscription.
 * Port to a Pydantic model with the same field names.
 */
export type BackendSubscriptionPayload = {
  stripe_event_id: string;
  event_type: string;
  user_id: string | null;
  plan_id: string | null;
  pack_id: string | null;
  kind: string | null;
  email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};
