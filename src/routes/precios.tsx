import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/precios")({
  beforeLoad: () => {
    throw redirect({ to: "/es/precios" as never, statusCode: 301 });
  },
});
