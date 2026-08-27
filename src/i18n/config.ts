export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

export const SITE_URL = "https://larkeyai.lovable.app";

export type PageKey =
  | "home"
  | "pricing"
  | "faq"
  | "contact"
  | "guide"
  | "login"
  | "privacy"
  | "terms";

/** Localized slug for every public page. Keys are stable; slugs are per-locale. */
export const PATHS: Record<PageKey, Record<Locale, string>> = {
  home: { es: "/es", en: "/en" },
  pricing: { es: "/es/precios", en: "/en/pricing" },
  faq: { es: "/es/faq", en: "/en/faq" },
  contact: { es: "/es/contacto", en: "/en/contact" },
  guide: { es: "/es/guia", en: "/en/whatsapp-setup-guide" },
  login: { es: "/es/acceso", en: "/en/login" },
  privacy: { es: "/es/legal/privacidad", en: "/en/legal/privacy" },
  terms: { es: "/es/legal/terminos", en: "/en/legal/terms" },
};

export const PAGE_KEYS = Object.keys(PATHS) as PageKey[];

export function pathFor(page: PageKey, locale: Locale): string {
  return PATHS[page][locale];
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return DEFAULT_LOCALE;
}

function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function pageFromPathname(pathname: string): PageKey | null {
  const target = normalize(pathname);
  for (const page of PAGE_KEYS) {
    for (const locale of LOCALES) {
      if (normalize(PATHS[page][locale]) === target) return page;
    }
  }
  return null;
}

/** Equivalent URL of the current page in the other language. */
export function alternatePath(pathname: string, locale: Locale): string {
  const page = pageFromPathname(pathname);
  if (page) return pathFor(page, locale);
  return pathFor("home", locale);
}
