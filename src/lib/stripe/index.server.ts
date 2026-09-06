/**
 * Payments module facade (server-only).
 *
 * This is the ONLY file the rest of the app imports from the payments module:
 * `src/lib/billing.functions.ts` (dashboard actions) and
 * `src/routes/api/public/stripe/webhook.ts` (Stripe intake).
 *
 * Internal layout — nothing outside this module should depend on it:
 *   client.server        Stripe SDK singleton
 *   config.server        all runtime configuration reads
 *   customers.server     Stripe Customer lifecycle
 *   checkout.server      Checkout Session builders
 *   subscriptions.server cancel / resume / change plan
 *   invoices.server      billing history reads
 *   webhook.server       signature verification + idempotent persistence
 *   apply-state.server   TEMPORARY local state bridge
 *   backend-forward.server hand-off to the FastAPI backend
 *   contracts.ts / time.ts  shared types and pure helpers
 *
 * FastAPI migration: each export below maps to one endpoint in the Python
 * service (see README.md); replacing the bodies keeps callers untouched.
 */
export { createSubscriptionCheckout, createPackCheckout } from "./checkout.server";
export { cancelAtPeriodEnd, resumeSubscription, changePlan } from "./subscriptions.server";
export { listInvoices } from "./invoices.server";
export { verifyAndDispatch } from "./webhook.server";
export type { WebhookOutcome } from "./webhook.server";
export type {
  CheckoutResponse,
  CreatePackCheckoutInput,
  CreateSubscriptionCheckoutInput,
  InvoiceSummary,
  ListInvoicesResponse,
  OkResponse,
} from "./contracts";
