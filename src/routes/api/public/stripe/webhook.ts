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
        const base = process.env.BACKEND_URL;
        if (!base) {
          return Response.json({ status: "error", reason: "BACKEND_URL is not configured" }, { status: 503 });
        }
        const target = new URL("/webhooks/stripe", base.endsWith("/") ? base : `${base}/`);
        const forwarded = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(signature ? { "Stripe-Signature": signature } : {}),
          },
          body: rawBody,
        });
        return new Response(await forwarded.text(), { status: forwarded.status });
      },
    },
  },
});
