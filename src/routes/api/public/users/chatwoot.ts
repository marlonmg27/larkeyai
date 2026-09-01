/**
 * Endpoint puente: actualiza los IDs de Chatwoot de un usuario.
 * Público (salta el auth del sitio) — el handler valida `X-Internal-Secret`.
 *
 * PATCH /api/public/users/chatwoot
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/users/chatwoot")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const auth = await import("@/lib/api/internal.server");
        const unauthorized = auth.verifyInternalSecret(request);
        if (unauthorized) return unauthorized;

        const mod = await import("@/lib/users/chatwoot-ids.server");
        const parsed = await auth.parseBody(request, mod.updateChatwootIdsSchema);
        if ("response" in parsed) return parsed.response;

        return mod.updateChatwootIds(parsed.data);
      },
    },
  },
});
