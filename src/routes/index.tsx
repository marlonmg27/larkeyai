import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Language gateway: permanent redirect to the Spanish version (x-default).
 * Deterministic on server and client so there is no HTML mismatch, and the
 * redirect is a real 301 that crawlers can follow to a page with a lang attribute.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/es" as never, statusCode: 301 });
  },
});
