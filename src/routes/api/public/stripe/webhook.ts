/**
 * Stripe webhook endpoint. Public (bypasses Lovable auth); the handler
 * verifies the Stripe signature over the raw body.
 *
 * See src/lib/stripe/README.md for Stripe Dashboard configuration.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const rawBody = await request.text();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { verifyAndDispatch } = await import("@/lib/stripe/webhook.server");

        const outcome = await verifyAndDispatch(supabaseAdmin, rawBody, signature);
        return new Response(outcome.body, { status: outcome.status });
      },
    },
  },
});
