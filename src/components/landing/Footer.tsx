import { Link } from "@tanstack/react-router";
import { MessageCircle, Mail } from "lucide-react";

import { ENTERPRISE_EMAIL } from "@/components/pricing/PlanCards";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useHref, useT, type PageKey } from "@/i18n";

export function Footer() {
  const t = useT();
  const href = useHref();

  const links: { label: string; page: PageKey }[] = [
    { label: t.nav.home, page: "home" },
    { label: t.nav.pricing, page: "pricing" },
    { label: t.nav.guide, page: "guide" },
    { label: t.nav.faq, page: "faq" },
    { label: t.nav.contact, page: "contact" },
    { label: t.nav.login, page: "login" },
  ];

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="section-container">
        <div className="grid gap-8 md:grid-cols-2 md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 text-foreground">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Larkey</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.footer.tagline}</p>
            <LanguageSwitcher className="mt-4" />
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{t.footer.links}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={href(link.page) as never}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">{t.footer.legal}</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    to={href("privacy") as never}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    to={href("terms") as never}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground">{t.footer.contact}</h4>
              <a
                href={`mailto:${ENTERPRISE_EMAIL}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {ENTERPRISE_EMAIL}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Larkey. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
