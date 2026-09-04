import { createFileRoute } from "@tanstack/react-router";

import { ContactView } from "@/views/ContactView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/en/contact")({
  component: ContactView,
  head: () => pageHeadWithBreadcrumb("contact", "en"),
});
