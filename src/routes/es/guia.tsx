import { createFileRoute } from "@tanstack/react-router";

import { GuideView } from "@/views/GuideView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/es/guia")({
  component: GuideView,
  head: () => pageHead("guide", "es"),
});
