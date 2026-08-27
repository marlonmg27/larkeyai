import { createFileRoute } from "@tanstack/react-router";

import { HomeView } from "@/views/HomeView";
import { organizationJsonLd, pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/en/")({
  component: HomeView,
  head: () => {
    const { meta, links } = pageHead("home", "en");
    return {
      meta,
      links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(organizationJsonLd("en")) },
      ],
    };
  },
});
