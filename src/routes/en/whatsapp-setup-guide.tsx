import { createFileRoute } from "@tanstack/react-router";

import { GuideView } from "@/views/GuideView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/en/whatsapp-setup-guide")({
  component: GuideView,
  head: () => pageHead("guide", "en"),
});
