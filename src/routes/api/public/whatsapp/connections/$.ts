/**
 * Endpoints puente de `whatsapp_connections`, unificados en un solo archivo.
 * Públicos (saltan el auth del sitio) — el handler valida `X-Internal-Secret`.
 *
 *   POST   /api/public/whatsapp/connections/upsert
 *   PATCH  /api/public/whatsapp/connections/status
 *   GET    /api/public/whatsapp/connections/by-phone?phone_number=...
 */
import { createFileRoute } from "@tanstack/react-router";

type Action = "upsert" | "status" | "by-phone";

const ALLOWED: Record<Action, string> = {
  upsert: "POST",
  status: "PATCH",
  "by-phone": "GET",
};

function normalize(splat: string | undefined): Action | null {
  const action = (splat ?? "").replace(/^\/+|\/+$/g, "");
  return action in ALLOWED ? (action as Action) : null;
}

async function handle({
  request,
  params,
}: {
  request: Request;
  params: { _splat?: string };
}): Promise<Response> {
  const internal = await import("@/lib/api/internal.server");

  const action = normalize(params._splat);
  if (!action) {
    return internal.json({ ok: false, error: "not_found" }, 404);
  }

  const unauthorized = internal.verifyInternalSecret(request);
  if (unauthorized) return unauthorized;

  if (request.method !== ALLOWED[action]) {
    return internal.json(
      { ok: false, error: "method_not_allowed", expected: ALLOWED[action] },
      405,
    );
  }

  const mod = await import("@/lib/whatsapp/connections.server");

  if (action === "by-phone") {
    const url = new URL(request.url);
    const parsed = internal.validate(
      { phone_number: url.searchParams.get("phone_number") ?? undefined },
      mod.findByPhoneSchema,
    );
    if ("response" in parsed) return parsed.response;
    return mod.findConnectionByPhone(parsed.data.phone_number);
  }

  if (action === "upsert") {
    const parsed = await internal.parseBody(request, mod.upsertConnectionSchema);
    if ("response" in parsed) return parsed.response;
    return mod.upsertConnection(parsed.data);
  }

  const parsed = await internal.parseBody(request, mod.patchConnectionSchema);
  if ("response" in parsed) return parsed.response;
  return mod.patchConnectionStatus(parsed.data);
}

export const Route = createFileRoute("/api/public/whatsapp/connections/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PATCH: handle,
    },
  },
});
