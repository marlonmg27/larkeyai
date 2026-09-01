/**
 * Endpoint puente: consume mensajes del saldo (RPC `decrement_messages`).
 * Público (salta el auth del sitio) — el handler valida `X-Internal-Secret`.
 *
 * POST /api/public/messages/decrement
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/messages/decrement")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await import("@/lib/api/internal.server");
        const unauthorized = auth.verifyInternalSecret(request);
        if (unauthorized) return unauthorized;

        const mod = await import("@/lib/messages/usage.server");
        const parsed = await auth.parseBody(request, mod.decrementSchema);
        if ("response" in parsed) return parsed.response;

        return mod.decrementMessages(parsed.data);
      },
    },
  },
});
