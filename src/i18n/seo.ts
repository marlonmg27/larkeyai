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

function langTag(locale: Locale) {
  return locale === "es" ? "es-MX" : "en-US";
}

export function organizationJsonLd(locale: Locale) {
  const dictionary = dictionaries[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Larkey",
        url: SITE_URL,
        description: dictionary.seo.home.description,
        email: "larkeyai@gmail.com",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website-${locale}`,
        name: "Larkey",
        url: SITE_URL + pathFor("home", locale),
        inLanguage: langTag(locale),
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

/** Breadcrumb trail: home -> current page. */
export function breadcrumbJsonLd(page: PageKey, locale: Locale) {
  const dictionary = dictionaries[locale];
  const name = dictionary.breadcrumb[page];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dictionary.nav.home,
        item: SITE_URL + pathFor("home", locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: SITE_URL + pathFor(page, locale),
      },
    ],
  };
}

type PlanOffer = {
  name: string;
  price: number;
  messages: number;
  interval: "month" | "year";
};

/** Public subscription catalog (mirrors the active rows of the plans table). */
const PLAN_OFFERS: PlanOffer[] = [
  { name: "Basic", price: 2000, messages: 7000, interval: "month" },
  { name: "Basic", price: 19200, messages: 7000, interval: "year" },
  { name: "Standard", price: 3200, messages: 12000, interval: "month" },
  { name: "Standard", price: 30720, messages: 12000, interval: "year" },
  { name: "Pro", price: 5000, messages: 20000, interval: "month" },
  { name: "Pro", price: 48000, messages: 20000, interval: "year" },
];

export function productJsonLd(locale: Locale) {
  const dictionary = dictionaries[locale];
  const url = SITE_URL + pathFor("pricing", locale);
  const per = locale === "es" ? { month: "al mes", year: "al año" } : { month: "per month", year: "per year" };
  const msgs = locale === "es" ? "mensajes incluidos" : "messages included";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Larkey",
    description: dictionary.seo.pricing.description,
    brand: { "@type": "Brand", name: "Larkey" },
    url,
    offers: {
      "@type": "OfferCatalog",
      name: dictionary.seo.pricing.title,
      inLanguage: langTag(locale),
      itemListElement: PLAN_OFFERS.map((plan) => ({
        "@type": "Offer",
        name: `Larkey ${plan.name} — ${plan.messages.toLocaleString(langTag(locale))} ${msgs} (${per[plan.interval]})`,
        price: plan.price,
        priceCurrency: "MXN",
        availability: "https://schema.org/InStock",
        url,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.price,
          priceCurrency: "MXN",
          billingDuration: 1,
          billingIncrement: 1,
          unitCode: plan.interval === "month" ? "MON" : "ANN",
        },
      })),
    },
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
