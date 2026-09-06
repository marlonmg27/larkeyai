/**
 * Stripe SDK singleton (server-only).
 *
 * Loaded only inside server functions / server routes. Configuration comes
 * from config.server.ts, never from process.env directly.
 * When migrating to the FastAPI microservice, replace this file with the
 * equivalent Python `stripe.api_key = os.environ["STRIPE_TEST_API_KEY"]`.
 */
import Stripe from "stripe";
import { stripeSecretKey } from "./config.server";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  _stripe = new Stripe(stripeSecretKey(), {
    apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return _stripe;
}

export { STRIPE_WEBHOOK_SECRET_ENV } from "./config.server";
