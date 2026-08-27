import { createFileRoute } from "@tanstack/react-router";

import { FaqView } from "@/views/FaqView";
import { faqJsonLd, pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/es/faq")({
  component: FaqView,
  head: () => {
    const { meta, links } = pageHead("faq", "es");
    return {
      meta,
      links,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd("es")) }],
    };
  },
});
