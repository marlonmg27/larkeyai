/**
 * Endpoint puente: ¿el usuario tiene saldo de mensajes? (RPC `can_send_message`).
 * Público (salta el auth del sitio) — el handler valida `X-Internal-Secret`.
 *
 * POST /api/public/messages/can-send
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/messages/can-send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await import("@/lib/api/internal.server");
        const unauthorized = auth.verifyInternalSecret(request);
        if (unauthorized) return unauthorized;

        const mod = await import("@/lib/messages/usage.server");
        const parsed = await auth.parseBody(request, mod.canSendSchema);
        if ("response" in parsed) return parsed.response;

        return mod.canSendMessage(parsed.data);
      },
    },
  },
});
