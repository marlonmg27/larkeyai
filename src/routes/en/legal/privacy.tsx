import { createFileRoute } from "@tanstack/react-router";

import { LegalView } from "@/views/LegalView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/en/legal/privacy")({
  component: () => <LegalView doc="privacy" />,
  head: () => pageHeadWithBreadcrumb("privacy", "en"),
});
