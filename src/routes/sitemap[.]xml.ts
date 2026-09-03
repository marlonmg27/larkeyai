import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { LOCALES, PAGE_KEYS, PATHS, SITE_URL } from "@/i18n/config";

const BASE_URL = SITE_URL;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // /dashboard is intentionally excluded: it requires authentication.
        const urls = PAGE_KEYS.flatMap((page) =>
          LOCALES.map((locale) => {
            const priority = page === "home" ? "1.0" : page === "pricing" ? "0.9" : "0.7";
            const changefreq = page === "home" || page === "pricing" ? "weekly" : "monthly";
            const alternates = [
              ...LOCALES.map(
                (alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${BASE_URL}${PATHS[page][alt]}" />`,
              ),
              `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${PATHS[page].es}" />`,
            ];
            return [
              `  <url>`,
              `    <loc>${BASE_URL}${PATHS[page][locale]}</loc>`,
              ...alternates,
              `    <changefreq>${changefreq}</changefreq>`,
              `    <priority>${priority}</priority>`,
              `  </url>`,
            ].join("\n");
          }),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
