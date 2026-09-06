/**
 * Single place where the payments module reads runtime configuration.
 *
 * Every value is read at call time (never at module scope) because the
 * Worker runtime injects environment variables per request.
 *
 * FastAPI mapping: os.environ[...] equivalents in the Python service.
 */

/** Public base URL of the site, used to build Checkout return URLs. */
export function siteUrl(): string {
  const url = process.env["SITE_URL"];
  if (!url) {
    throw new Error(
      "SITE_URL is not configured. Set it to the public base URL (e.g. https://larkeyai.lovable.app).",
    );
  }
  return url.replace(/\/+$/, "");
}

/** Stripe secret key. Accepts the legacy name already provisioned here. */
export function stripeSecretKey(): string {
  const key = process.env["STRIPE_SECRET_KEY"] ?? process.env["STRIPE_TEST_API_KEY"];
  if (!key) throw new Error("Stripe secret key is not set (STRIPE_SECRET_KEY / STRIPE_TEST_API_KEY)");
  return key;
}

/** Signing secret used to verify the raw webhook body. Null when unset. */
export function stripeWebhookSecret(): string | null {
  return process.env["STRIPE_WEBHOOK_SECRET"] ?? null;
}

/** Credentials for forwarding verified events to the Python backend. */
export function backendForwardConfig(): { baseUrl: string; internalSecret: string } | null {
  const baseUrl = process.env["BACKEND_URL"];
  const internalSecret = process.env["BACKEND_INTERNAL_SECRET"];
  if (!baseUrl || !internalSecret) return null;
  return { baseUrl, internalSecret };
}

export const STRIPE_WEBHOOK_SECRET_ENV = "STRIPE_WEBHOOK_SECRET";
