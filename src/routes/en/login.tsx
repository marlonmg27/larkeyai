import { createFileRoute } from "@tanstack/react-router";

import { AuthView } from "@/views/AuthView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/en/login")({
  component: AuthView,
  head: () => pageHead("login", "en"),
});
