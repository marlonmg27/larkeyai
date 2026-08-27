import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PlanCards, type PlanRow } from "@/components/pricing/PlanCards";
import { useHref, useT } from "@/i18n";

export function Pricing() {
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
    <section id="precios" className="relative border-y border-border bg-secondary/30 py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.pricing.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.sectionSubtitle}</p>
        </div>

        <div className="mt-12">
          <PlanCards onSelectPlan={handleSelectPlan} ctaLabel={t.pricing.chooseCta} />
        </div>
      </div>
    </section>
  );
}
