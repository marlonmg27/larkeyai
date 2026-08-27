import { createFileRoute } from "@tanstack/react-router";

import { PricingView } from "@/views/PricingView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/es/precios")({
  component: PricingView,
  head: () => pageHead("pricing", "es"),
});
