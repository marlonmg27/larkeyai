import { createFileRoute } from "@tanstack/react-router";

import { PricingView } from "@/views/PricingView";
import { breadcrumbJsonLd, pageHead, productJsonLd } from "@/i18n/seo";

export const Route = createFileRoute("/en/pricing")({
  component: PricingView,
  head: () => {
    const { meta, links } = pageHead("pricing", "en");
    return {
      meta,
      links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(productJsonLd("en")) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd("pricing", "en")) },
      ],
    };
  },
});
