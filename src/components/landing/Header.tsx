import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LarkeyMark } from "@/components/brand/LarkeyMark";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useHref, useT } from "@/i18n";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const href = useHref();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success(t.nav.loggedOut);
    navigate({ to: href("home") as never, replace: true });
  }

  return (
    <header className="sticky top-12 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="section-container flex h-16 items-center justify-between">
        <Link to={href("home") as never} className="flex items-center gap-2 text-foreground">
          <LarkeyMark className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">Larkey</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            {t.nav.howItWorks}
          </a>
          <a href="#precios" className="transition-colors hover:text-foreground">
            {t.nav.pricing}
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            {t.nav.faq}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">{t.nav.dashboard}</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" /> {t.nav.logout}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to={href("login") as never}>{t.nav.login}</Link>
              </Button>
              <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to={href("login") as never}>{t.nav.start}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
