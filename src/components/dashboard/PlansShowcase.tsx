import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Check, Sparkles, Rocket, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSubscriptionCheckout } from "@/lib/billing.functions";
import { toast } from "sonner";

type PlanRow = {
  id: string;
  name: string;
  tier: string | null;
  price: number;
  messages_included: number;
  billing_interval: string;
};

type TierKey = "basic" | "standard" | "pro";

const TIER_META: Record<TierKey, {
  label: string;
  tagline: string;
  icon: typeof Sparkles;
  perks: string[];
  highlight?: boolean;
}> = {
  basic: {
    label: "Basic",
    tagline: "Ideal para empezar a automatizar tu WhatsApp.",
    icon: Sparkles,
    perks: [
      "Asistente afinado a tu operación",
      "Canal principal: WhatsApp",
      "Bandeja unificada",
      "Soporte por email",
    ],
  },
  standard: {
    label: "Standard",
    tagline: "El equilibrio entre volumen y control.",
    icon: Rocket,
    perks: [
      "Todo lo del plan Basic",
      "Ajustes de tono y flujos personalizados",
      "WhatsApp + Instagram + Messenger",
      "Soporte prioritario",
    ],
    highlight: true,
  },
  pro: {
    label: "Pro",
    tagline: "Para negocios que reciben mensajes cada día.",
    icon: Crown,
    perks: [
      "Todo lo del plan Standard",
      "WhatsApp, Instagram, Telegram, Messenger",
      "Integraciones a tu stack",
      "Onboarding acompañado",
    ],
  },
};

const TIER_ORDER: TierKey[] = ["basic", "standard", "pro"];

function formatMxn(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);
}

export function PlansShowcase() {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const checkout = useServerFn(createSubscriptionCheckout);

  const { data: plans, isLoading } = useQuery<PlanRow[]>({
    queryKey: ["plans-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, tier, price, messages_included, billing_interval")
        .eq("active", true);
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });

  const byTier = useMemo(() => {
    const m: Partial<Record<TierKey, Record<"month" | "year", PlanRow | undefined>>> = {};
    for (const p of plans ?? []) {
      const t = (p.tier ?? "").toLowerCase() as TierKey;
      if (!TIER_ORDER.includes(t)) continue;
      const bucket = m[t] ?? { month: undefined, year: undefined };
      bucket[p.billing_interval as "month" | "year"] = p;
      m[t] = bucket;
    }
    return m;
  }, [plans]);

  async function handleSubscribe(planId: string) {
    setPendingId(planId);
    try {
      const { url } = await checkout({ data: { planId } });
      window.location.href = url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No pudimos iniciar el checkout.";
      toast.error(msg);
      setPendingId(null);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Elige un plan y activa tu asistente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sin permanencia. 14 días de prueba gratis, sin tarjeta.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-secondary/40 p-1 text-sm">
          <button
            onClick={() => setInterval("month")}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              interval === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              interval === "year" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Anual
            <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              -20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIER_ORDER.map((tier, idx) => {
          const meta = TIER_META[tier];
          const plan = byTier[tier]?.[interval];
          const Icon = meta.icon;
          const monthlyEq = interval === "year" && plan ? plan.price / 12 : null;
          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
            >
              <Card
                className={`relative h-full overflow-hidden ${
                  meta.highlight ? "border-brand shadow-lg ring-1 ring-brand" : ""
                }`}
              >
                {meta.highlight && (
                  <div className="absolute right-3 top-3">
                    <Badge className="bg-brand text-brand-foreground hover:bg-brand">Recomendado</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{meta.label}</CardTitle>
                  <CardDescription>{meta.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <div className="mb-4">
                    {isLoading || !plan ? (
                      <div className="h-10 w-32 animate-pulse rounded bg-muted" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold tracking-tight">
                            {formatMxn(plan.price)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /{interval === "month" ? "mes" : "año"}
                          </span>
                        </div>
                        {monthlyEq && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            ≈ {formatMxn(monthlyEq)} / mes facturado anual
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-4 rounded-lg bg-accent/40 px-3 py-2 text-sm font-medium">
                    {plan ? plan.messages_included.toLocaleString("es-MX") : "—"} mensajes / mes
                  </div>

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {meta.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span className="text-muted-foreground">{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    disabled={!plan || pendingId === plan?.id}
                    onClick={() => plan && handleSubscribe(plan.id)}
                    className={
                      meta.highlight
                        ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                        : "w-full"
                    }
                    variant={meta.highlight ? "default" : "outline"}
                  >
                    {pendingId === plan?.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo…
                      </>
                    ) : (
                      "Empezar prueba de 14 días"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
