import { createFileRoute } from "@tanstack/react-router";

import { GuideView } from "@/views/GuideView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/en/whatsapp-setup-guide")({
  component: GuideView,
  head: () => pageHeadWithBreadcrumb("guide", "en"),
});
