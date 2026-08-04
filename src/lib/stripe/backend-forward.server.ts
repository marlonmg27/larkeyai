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
export function buildSubscriptionPayload(event: Stripe.Event): BackendSubscriptionPayload {
  const obj = event.data.object as unknown as AnyRecord;
  const metadata = (obj["metadata"] ?? {}) as AnyRecord;
  const customerDetails = (obj["customer_details"] ?? {}) as AnyRecord;
  const customerObj = (typeof obj["customer"] === "object" ? obj["customer"] : {}) as AnyRecord;

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
    stripe_subscription_id:
      event.type.startsWith("customer.subscription.")
        ? str(obj["id"])
        : refId(obj["subscription"]),
    status: str(obj["status"]) ?? str(obj["payment_status"]) ?? null,
  };
}

export async function forwardToBackend(payload: BackendSubscriptionPayload): Promise<void> {
  const baseUrl = process.env["BACKEND_URL"];
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];

  if (!baseUrl || !internalSecret) {
    console.error(
      "[stripe-webhook] backend forward skipped: BACKEND_URL or BACKEND_INTERNAL_SECRET not configured",
      { event_id: payload.stripe_event_id, event_type: payload.event_type },
    );
    return;
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
      console.error("[stripe-webhook] backend forward returned non-2xx", {
        event_id: payload.stripe_event_id,
        event_type: payload.event_type,
        status: res.status,
        body: body.slice(0, 500),
      });
    }
  } catch (err) {
    console.error("[stripe-webhook] backend forward failed", {
      event_id: payload.stripe_event_id,
      event_type: payload.event_type,
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}
