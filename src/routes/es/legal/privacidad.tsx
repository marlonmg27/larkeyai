import { createFileRoute } from "@tanstack/react-router";

import { LegalView } from "@/views/LegalView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/es/legal/privacidad")({
  component: () => <LegalView doc="privacy" />,
  head: () => pageHeadWithBreadcrumb("privacy", "es"),
});
