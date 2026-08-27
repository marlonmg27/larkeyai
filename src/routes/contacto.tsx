import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/contacto")({
  beforeLoad: () => {
    throw redirect({ to: "/es/contacto" as never, statusCode: 301 });
  },
});
