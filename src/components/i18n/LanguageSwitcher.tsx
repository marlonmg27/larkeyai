import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { useAlternate } from "@/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, href } = useAlternate();

  return (
    <Link
      to={href as never}
      hrefLang={locale}
      aria-label={locale === "en" ? "Switch to English" : "Cambiar a español"}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "en" ? "English" : "Español"}
    </Link>
  );
}
