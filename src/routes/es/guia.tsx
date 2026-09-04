import { createFileRoute } from "@tanstack/react-router";

import { GuideView } from "@/views/GuideView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/es/guia")({
  component: GuideView,
  head: () => pageHeadWithBreadcrumb("guide", "es"),
});
