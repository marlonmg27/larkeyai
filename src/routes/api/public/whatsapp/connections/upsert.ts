/**
 * Endpoint puente: upsert de la conexión de WhatsApp del cliente.
 * Público (salta el auth del sitio) — el handler valida `X-Internal-Secret`.
 *
 * POST /api/public/whatsapp/connections/upsert
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/whatsapp/connections/upsert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const mod = await import("@/lib/whatsapp/connections.server");

        const unauthorized = mod.verifyInternalSecret(request);
        if (unauthorized) return unauthorized;

        const parsed = await mod.parseBody(request, mod.upsertConnectionSchema);
        if ("response" in parsed) return parsed.response;

        return mod.upsertConnection(parsed.data);
      },
    },
  },
});
