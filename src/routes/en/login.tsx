import { createFileRoute } from "@tanstack/react-router";

import { AuthView } from "@/views/AuthView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/en/login")({
  component: AuthView,
  head: () => pageHeadWithBreadcrumb("login", "en"),
});
