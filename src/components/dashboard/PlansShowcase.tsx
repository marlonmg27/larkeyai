import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createSubscriptionCheckout } from "@/lib/billing.functions";
import { PlanCards, type PlanRow } from "@/components/pricing/PlanCards";
import { toast } from "sonner";

export function PlansShowcase() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const checkout = useServerFn(createSubscriptionCheckout);

  async function handleSubscribe(plan: PlanRow) {
    setPendingId(plan.id);
    try {
      const { url } = await checkout({ data: { planId: plan.id } });
      window.location.href = url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No pudimos iniciar el checkout.";
      toast.error(msg);
      setPendingId(null);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Elige un plan y activa tu asistente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sin permanencia. 14 días de prueba gratis, sin tarjeta.
        </p>
      </div>

      <PlanCards
        onSelectPlan={handleSubscribe}
        ctaLabel="Ir al checkout"
        pendingPlanId={pendingId}
      />
    </section>
  );
}
