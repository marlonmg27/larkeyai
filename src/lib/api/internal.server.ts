/**
 * Helpers compartidos de los endpoints puente internos (`/api/public/...`).
 *
 * Todos los endpoints que el backend FastAPI consume usan el mismo patrón:
 * header `X-Internal-Secret` (comparación timing-safe), validación con Zod y
 * respuestas JSON con forma `{ ok, ... }`.
 */
import type { z } from "zod";

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Devuelve una Response cuando la autenticación falla, o null si es válida. */
export function verifyInternalSecret(request: Request): Response | null {
  const expected = process.env["BACKEND_INTERNAL_SECRET"];
  if (!expected) {
    console.error("[internal-api] BACKEND_INTERNAL_SECRET sin configurar");
    return json({ ok: false, error: "server_not_configured" }, 500);
  }
  const provided = request.headers.get("x-internal-secret") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

export type ParsedBody<T> = { data: T } | { response: Response };

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParsedBody<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: json({ ok: false, error: "invalid_json" }, 400) };
  }
  return validate(raw, schema);
}

export function validate<T>(raw: unknown, schema: z.ZodType<T>): ParsedBody<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: json(
        {
          ok: false,
          error: "validation_error",
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      ),
    };
  }
  return { data: parsed.data };
}
