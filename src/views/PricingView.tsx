import { useNavigate } from "@tanstack/react-router";

import { Footer } from "@/components/landing/Footer";
import { PlanCards, type PlanRow } from "@/components/pricing/PlanCards";
import { useAuth } from "@/hooks/use-auth";
import { useHref, useT } from "@/i18n";

export function PricingView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const href = useHref();

  function handleSelectPlan(plan: PlanRow) {
    try {
      sessionStorage.setItem("larkey:selected_plan", plan.id);
    } catch {
      // sessionStorage puede no estar disponible; no es crítico
    }
    navigate({ to: (user ? "/dashboard" : href("login")) as never });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="section-container">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.pricing.h1}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t.pricing.intro}</p>

          <div className="mt-12">
            <PlanCards onSelectPlan={handleSelectPlan} ctaLabel={t.pricing.chooseCta} />
          </div>

          <div className="mt-16 border-t border-border pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t.pricing.packsTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t.pricing.packsSubtitle}</p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {t.pricing.packsLoggedOut}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
