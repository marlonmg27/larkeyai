import { createFileRoute } from "@tanstack/react-router";

import { PricingView } from "@/views/PricingView";
import { breadcrumbJsonLd, pageHead, productJsonLd } from "@/i18n/seo";

export const Route = createFileRoute("/es/precios")({
  component: PricingView,
  head: () => {
    const { meta, links } = pageHead("pricing", "es");
    return {
      meta,
      links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(productJsonLd("es")) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd("pricing", "es")) },
      ],
    };
  },
});
