import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PlanCards, type PlanRow } from "@/components/pricing/PlanCards";

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleSelectPlan(plan: PlanRow) {
    try {
      sessionStorage.setItem("larkey:selected_plan", plan.id);
    } catch {
      // sessionStorage puede no estar disponible; no es crítico
    }
    navigate({ to: user ? "/dashboard" : "/auth" });
  }

  return (
    <section id="precios" className="relative border-y border-border bg-secondary/30 py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Planes y precios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Escala tu atención sin contratar más gente. Pagas por mensajes reales, no por promesas.
            Sin permanencia y 14 días de prueba gratis.
          </p>
        </div>

        <div className="mt-12">
          <PlanCards onSelectPlan={handleSelectPlan} ctaLabel="Elegir plan" />
        </div>
      </div>
    </section>
  );
}
