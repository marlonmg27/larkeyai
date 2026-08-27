import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/es/acceso" as never, statusCode: 301 });
  },
});
