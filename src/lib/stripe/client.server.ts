/**
 * Stripe SDK singleton (server-only).
 *
 * Loaded only inside server functions / server routes.
 * When migrating to the FastAPI microservice, replace this file with the
 * equivalent Python `stripe.api_key = os.environ["STRIPE_TEST_API_KEY"]`.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_TEST_API_KEY;
  if (!key) throw new Error("STRIPE_TEST_API_KEY is not set");
  _stripe = new Stripe(key, {
    apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return _stripe;
}

export const STRIPE_WEBHOOK_SECRET_ENV = "STRIPE_WEBHOOK_SECRET";
