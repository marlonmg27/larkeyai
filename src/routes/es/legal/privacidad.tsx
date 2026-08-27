import { createFileRoute } from "@tanstack/react-router";

import { LegalView } from "@/views/LegalView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/es/legal/privacidad")({
  component: () => <LegalView doc="privacy" />,
  head: () => pageHead("privacy", "es"),
});
