import { useRouterState } from "@tanstack/react-router";

import { es, type Dict } from "./es";
import { en } from "./en";
import { alternatePath, localeFromPathname, pathFor, type Locale, type PageKey } from "./config";

export const dictionaries: Record<Locale, Dict> = { es, en };

export function dict(locale: Locale): Dict {
  return dictionaries[locale];
}

/** Locale derived from the URL, so server-rendered HTML is already translated. */
export function useLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return localeFromPathname(pathname);
}

export function useT(): Dict {
  return dictionaries[useLocale()];
}

/** Localized href for a page key, based on the active locale. */
export function useHref(): (page: PageKey) => string {
  const locale = useLocale();
  return (page: PageKey) => pathFor(page, locale);
}

export function useAlternate(): { locale: Locale; href: string } {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = localeFromPathname(pathname);
  const other: Locale = locale === "es" ? "en" : "es";
  return { locale: other, href: alternatePath(pathname, other) };
}

export * from "./config";
export type { Dict };
