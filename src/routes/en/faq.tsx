import { createFileRoute } from "@tanstack/react-router";

import { FaqView } from "@/views/FaqView";
import { faqJsonLd, pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/en/faq")({
  component: FaqView,
  head: () => {
    const { meta, links } = pageHead("faq", "en");
    return {
      meta,
      links,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd("en")) }],
    };
  },
});
