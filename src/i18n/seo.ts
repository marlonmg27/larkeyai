import { PATHS, SITE_URL, pathFor, type Locale, type PageKey } from "./config";
import { dictionaries } from "./index";

type MetaEntry = Record<string, string>;

export function pageHead(page: PageKey, locale: Locale) {
  const seo = dictionaries[locale].seo[page];
  const url = SITE_URL + pathFor(page, locale);

  const meta: MetaEntry[] = [
    { title: seo.title },
    { name: "description", content: seo.description },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:locale", content: locale === "es" ? "es_MX" : "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
  ];

  const links = [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "es", href: SITE_URL + PATHS[page].es },
    { rel: "alternate", hrefLang: "en", href: SITE_URL + PATHS[page].en },
    { rel: "alternate", hrefLang: "x-default", href: SITE_URL + PATHS[page].es },
  ];

  return { meta, links };
}

export function organizationJsonLd(locale: Locale) {
  const dictionary = dictionaries[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Larkey",
        url: SITE_URL,
        description: dictionary.seo.home.description,
        email: "marlonmolinag12@gmail.com",
      },
      {
        "@type": "WebSite",
        name: "Larkey",
        url: SITE_URL + pathFor("home", locale),
        inLanguage: locale === "es" ? "es-MX" : "en-US",
        publisher: { "@type": "Organization", name: "Larkey", url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        inLanguage: locale === "es" ? "es-MX" : "en-US",
        mainEntity: dictionary.faq.items.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

export function faqJsonLd(locale: Locale) {
  const dictionary = dictionaries[locale];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "es" ? "es-MX" : "en-US",
    mainEntity: dictionary.faq.items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
