/**
 * Forwards verified Stripe events to the Python (FastAPI) backend.
 *
 * FastAPI mapping:
 *   POST ${BACKEND_URL}/webhooks/subscription
 *   header: X-Internal-Secret: ${BACKEND_INTERNAL_SECRET}
 *
 * Never throws: the caller must always answer Stripe with 200 once the event
 * has been persisted in stripe_events.
 */
import type Stripe from "stripe";
import type { BackendSubscriptionPayload } from "./contracts";
import { getStripe } from "./client.server";
import { iso, subscriptionPeriodEndIso } from "./webhook.server";

const FORWARD_TIMEOUT_MS = 10_000;

type AnyRecord = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function refId(value: unknown): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  if (value && typeof value === "object") return str((value as AnyRecord)["id"]);
  return null;
}

/**
 * Extracts the fields the Python backend needs from any handled Stripe event.
 * Shapes differ per event type, so all reads are defensive.
 */
export async function buildSubscriptionPayload(
  event: Stripe.Event,
): Promise<BackendSubscriptionPayload> {
  const obj = event.data.object as unknown as AnyRecord;
  const metadata = (obj["metadata"] ?? {}) as AnyRecord;
  const customerDetails = (obj["customer_details"] ?? {}) as AnyRecord;
  const customerObj = (typeof obj["customer"] === "object" ? obj["customer"] : {}) as AnyRecord;

  const isSubscriptionEvent = event.type.startsWith("customer.subscription.");
  const stripeSubscriptionId = isSubscriptionEvent ? str(obj["id"]) : refId(obj["subscription"]);

  let trialEndsAt: string | null = null;
  let currentPeriodEnd: string | null = null;
  let cancelAtPeriodEnd: boolean | null = null;

  const readFrom = (sub: Stripe.Subscription) => {
    trialEndsAt = iso(sub.trial_end) ?? null;
    currentPeriodEnd = subscriptionPeriodEndIso(sub) ?? null;
    cancelAtPeriodEnd = typeof sub.cancel_at_period_end === "boolean" ? sub.cancel_at_period_end : null;
  };

  if (isSubscriptionEvent) {
    // The event object already IS the full Subscription — no extra API call.
    readFrom(event.data.object as unknown as Stripe.Subscription);
  } else if (
    (event.type === "checkout.session.completed" || event.type === "invoice.paid") &&
    stripeSubscriptionId
  ) {
    try {
      readFrom(await getStripe().subscriptions.retrieve(stripeSubscriptionId));
    } catch (err) {
      console.error("[stripe-webhook] could not retrieve subscription for payload", {
        event_id: event.id,
        event_type: event.type,
        subscription_id: stripeSubscriptionId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    stripe_event_id: event.id,
    event_type: event.type,
    user_id: str(metadata["user_id"]),
    plan_id: str(metadata["plan_id"]),
    pack_id: str(metadata["pack_id"]),
    kind: str(metadata["kind"]),
    email:
      str(obj["customer_email"]) ??
      str(customerDetails["email"]) ??
      str(customerObj["email"]) ??
      null,
    stripe_customer_id: refId(obj["customer"]),
    stripe_subscription_id: stripeSubscriptionId,
    status: str(obj["status"]) ?? str(obj["payment_status"]) ?? null,
    trial_ends_at: trialEndsAt,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  };
}

export type ForwardResult = { ok: true } | { ok: false; error: string };

/** Never throws. Returns the outcome so the caller can persist it. */
export async function forwardToBackend(payload: BackendSubscriptionPayload): Promise<ForwardResult> {
  const baseUrl = process.env["BACKEND_URL"];
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];

  const logCtx = { event_id: payload.stripe_event_id, event_type: payload.event_type };

  if (!baseUrl || !internalSecret) {
    const error = "BACKEND_URL or BACKEND_INTERNAL_SECRET not configured";
    console.error("[stripe-webhook] backend forward skipped:", error, logCtx);
    return { ok: false, error };
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/webhooks/subscription`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `HTTP ${res.status}: ${body.slice(0, 500)}`;
      console.error("[stripe-webhook] backend forward returned non-2xx", { ...logCtx, status: res.status, body: body.slice(0, 500) });
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[stripe-webhook] backend forward failed", { ...logCtx, reason: error });
    return { ok: false, error };
  }
}

