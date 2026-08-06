import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Sparkles, Rocket, Crown, Building2, Loader2, AlertCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ENTERPRISE_EMAIL = "marlonmolinag12@gmail.com";

export const ENTERPRISE_MAILTO = `mailto:${ENTERPRISE_EMAIL}?subject=${encodeURIComponent(
  "Quiero un plan Enterprise de Larkey",
)}&body=${encodeURIComponent(
  "Hola Larkey:\n\nMe interesa un plan Enterprise para mi negocio.\n\nNegocio:\nVolumen aproximado de mensajes al mes:\nCanales que necesito (WhatsApp, Instagram, Telegram, Messenger, WebApp):\n\nGracias.",
)}`;

export type PlanRow = {
  id: string;
  name: string;
  tier: string | null;
  price: number;
  messages_included: number;
  billing_interval: string;
};

export type TierKey = "basic" | "standard" | "pro";

const TIER_META: Record<
  TierKey,
  {
    label: string;
    tagline: string;
    icon: typeof Sparkles;
    perks: string[];
    highlight?: boolean;
  }
> = {
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

const ENTERPRISE_META = {
  label: "Enterprise",
  tagline: "Para equipos con alto volumen y necesidades a medida.",
  icon: Building2,
  perks: [
    "Mensajes a medida según tu volumen",
    "Asistentes diseñados para tu operación",
    "WhatsApp, Instagram, Telegram, Messenger y WebApps",
    "Integraciones dedicadas a tu stack",
    "Onboarding y cuenta asignada",
  ],
};

const TIER_ORDER: TierKey[] = ["basic", "standard", "pro"];

function formatMxn(v: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v);
}

export function usePlansCatalog() {
  return useQuery<PlanRow[]>({
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
}

type PlanCardsProps = {
  /** Called when the user picks one of the paid plans. */
  onSelectPlan: (plan: PlanRow) => void;
  /** CTA label for the paid plans. */
  ctaLabel?: string;
  /** Plan id currently being processed (shows a spinner). */
  pendingPlanId?: string | null;
};

export function PlanCards({
  onSelectPlan,
  ctaLabel = "Empezar prueba gratis",
  pendingPlanId = null,
}: PlanCardsProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const { data: plans, isLoading, isError, error } = usePlansCatalog();

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

  const hasPlansForInterval = TIER_ORDER.some((tier) => Boolean(byTier[tier]?.[interval]));

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-secondary/40 p-1 text-sm">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              interval === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
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

      {isError ? (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">No pudimos cargar los planes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Intenta recargar la página."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {!isError && !isLoading && !hasPlansForInterval && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No hay planes disponibles en este momento. Escríbenos si necesitas ayuda.
              </CardContent>
            </Card>
          )}

          {hasPlansForInterval || isLoading
            ? TIER_ORDER.map((tier, idx) => {
                const meta = TIER_META[tier];
                const plan = byTier[tier]?.[interval];
                const Icon = meta.icon;
                const planPrice = plan ? Number(plan.price) : 0;
                const monthlyEq = interval === "year" && plan ? planPrice / 12 : null;
                return (
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
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
                                <span className="text-4xl font-bold tracking-tight">{formatMxn(planPrice)}</span>
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
                          disabled={!plan || pendingPlanId === plan?.id}
                          onClick={() => plan && onSelectPlan(plan)}
                          className={
                            meta.highlight
                              ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                              : "w-full"
                          }
                          variant={meta.highlight ? "default" : "outline"}
                        >
                          {pendingPlanId === plan?.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo…
                            </>
                          ) : (
                            ctaLabel
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            : null}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: 0.24 }}
          >
            <Card className="relative h-full overflow-hidden">
              <CardHeader>
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                  <ENTERPRISE_META.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{ENTERPRISE_META.label}</CardTitle>
                <CardDescription>{ENTERPRISE_META.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex h-full flex-col">
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">Personalizado</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Cotización según tu operación</p>
                </div>

                <div className="mb-4 rounded-lg bg-accent/40 px-3 py-2 text-sm font-medium">
                  Mensajes a medida
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {ENTERPRISE_META.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span className="text-muted-foreground">{perk}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="w-full">
                  <a href={ENTERPRISE_MAILTO}>
                    <Mail className="mr-2 h-4 w-4" /> Contactar ventas
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
