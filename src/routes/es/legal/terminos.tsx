import { createFileRoute } from "@tanstack/react-router";

import { LegalView } from "@/views/LegalView";
import { pageHeadWithBreadcrumb } from "@/i18n/seo";

export const Route = createFileRoute("/es/legal/terminos")({
  component: () => <LegalView doc="terms" />,
  head: () => pageHeadWithBreadcrumb("terms", "es"),
});
