import { createFileRoute } from "@tanstack/react-router";

import { AuthView } from "@/views/AuthView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/es/acceso")({
  component: AuthView,
  head: () => pageHead("login", "es"),
});
