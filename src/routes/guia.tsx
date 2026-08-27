import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/guia")({
  beforeLoad: () => {
    throw redirect({ to: "/es/guia" as never, statusCode: 301 });
  },
});
