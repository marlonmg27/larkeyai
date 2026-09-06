/**
 * Webhook intake: signature verification + idempotent persistence, then
 * delegation (server-only).
 *
 * FastAPI mapping:
 *   POST /webhooks/stripe  (raw body, stripe-signature header)
 *
 * Idempotency: every event is persisted to stripe_events (PK = event.id).
 * A conflict short-circuits with success — safe to retry.
 *
 * Responsibilities are split on purpose:
 *   this file            -> verify + persist + orchestrate
 *   apply-state.server   -> temporary local state bridge
 *   backend-forward.server -> hand-off to the Python backend
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getStripe } from "./client.server";
import { stripeWebhookSecret } from "./config.server";
import { applyEventLocally, userIdFromCustomer } from "./apply-state.server";
import { buildSubscriptionPayload, forwardToBackend } from "./backend-forward.server";

type Json = Database["public"]["Tables"]["stripe_events"]["Insert"]["payload"];

export type WebhookOutcome = { status: number; body: string };

export async function verifyAndDispatch(
  supabaseAdmin: SupabaseClient<Database>,
  rawBody: string,
  signature: string | null,
): Promise<WebhookOutcome> {
  const secret = stripeWebhookSecret();
  if (!secret) return { status: 500, body: "webhook secret not configured" };
  if (!signature) return { status: 400, body: "missing signature" };

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
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
    await applyEventLocally(supabaseAdmin, event);
  } catch (err) {
    console.error("[stripe-webhook] handler failed", event.type, err);
    await supabaseAdmin.from("stripe_events").delete().eq("id", event.id);
    return { status: 500, body: "handler failed" };
  }

  await forwardAndTrack(supabaseAdmin, event);

  return { status: 200, body: "ok" };
}

/**
 * Forwards to the Python backend and records the outcome. Never affects the
 * response to Stripe: the event is already persisted and can be replayed.
 */
async function forwardAndTrack(
  supabaseAdmin: SupabaseClient<Database>,
  event: Stripe.Event,
): Promise<void> {
  try {
    const payload = await buildSubscriptionPayload(event);
    if (!payload.user_id && payload.stripe_customer_id) {
      payload.user_id = await userIdFromCustomer(supabaseAdmin, payload.stripe_customer_id);
    }
    const result = await forwardToBackend(payload);

    const { error: trackErr } = await supabaseAdmin
      .from("stripe_events")
      .update(
        result.ok
          ? { forwarded_to_backend: true, forward_error: null }
          : { forwarded_to_backend: false, forward_error: result.error },
      )
      .eq("id", event.id);
    if (trackErr) {
      console.error("[stripe-webhook] failed to record forward status", event.id, trackErr);
    }
  } catch (err) {
    console.error("[stripe-webhook] backend forward crashed", event.id, err);
  }
}
