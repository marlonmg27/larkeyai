/**
 * Endpoint puente: actualiza el estado de la conexión de WhatsApp.
 * Público (salta el auth del sitio) — el handler valida `X-Internal-Secret`.
 *
 * PATCH /api/public/whatsapp/connections/status
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/whatsapp/connections/status")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const mod = await import("@/lib/whatsapp/connections.server");

        const unauthorized = mod.verifyInternalSecret(request);
        if (unauthorized) return unauthorized;

        const parsed = await mod.parseBody(request, mod.patchConnectionSchema);
        if ("response" in parsed) return parsed.response;

        return mod.patchConnectionStatus(parsed.data);
      },
    },
  },
});
