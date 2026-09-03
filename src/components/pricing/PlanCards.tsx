import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Sparkles, Rocket, Crown, Building2, Loader2, AlertCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale, useT } from "@/i18n";

export const ENTERPRISE_EMAIL = "larkeyai@gmail.com";

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

const TIER_STYLE: Record<TierKey, { label: string; icon: typeof Sparkles; highlight?: boolean }> = {
  basic: { label: "Basic", icon: Sparkles },
  standard: { label: "Standard", icon: Rocket, highlight: true },
  pro: { label: "Pro", icon: Crown },
};

const TIER_ORDER: TierKey[] = ["basic", "standard", "pro"];

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

export function PlanCards({ onSelectPlan, ctaLabel, pendingPlanId = null }: PlanCardsProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const { data: plans, isLoading, isError, error } = usePlansCatalog();
  const t = useT();
  const locale = useLocale();
  const numberLocale = locale === "es" ? "es-MX" : "en-US";
  const cta = ctaLabel ?? t.pricing.trialCta;

  function formatMxn(v: number) {
    return new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(v);
  }

  const byTier = useMemo(() => {
    const m: Partial<Record<TierKey, Record<"month" | "year", PlanRow | undefined>>> = {};
    for (const p of plans ?? []) {
      const tier = (p.tier ?? "").toLowerCase() as TierKey;
      if (!TIER_ORDER.includes(tier)) continue;
      const bucket = m[tier] ?? { month: undefined, year: undefined };
      bucket[p.billing_interval as "month" | "year"] = p;
      m[tier] = bucket;
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
            {t.pricing.monthly}
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              interval === "year" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.pricing.yearly}
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
              <p className="font-medium text-destructive">{t.pricing.loadError}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : t.pricing.loadErrorHint}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {!isLoading && !hasPlansForInterval && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">{t.pricing.noPlans}</CardContent>
            </Card>
          )}

          {hasPlansForInterval || isLoading
            ? TIER_ORDER.map((tier, idx) => {
                const style = TIER_STYLE[tier];
                const copy = t.pricing.tiers[tier];
                const plan = byTier[tier]?.[interval];
                const Icon = style.icon;
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
                      className={`relative flex h-full flex-col overflow-hidden ${
                        style.highlight ? "border-brand shadow-lg ring-1 ring-brand" : ""
                      }`}
                    >
                      {style.highlight && (
                        <div className="absolute right-3 top-3">
                          <Badge className="bg-brand text-brand-foreground hover:bg-brand">
                            {t.pricing.recommended}
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl">{style.label}</CardTitle>
                        <CardDescription>{copy.tagline}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col">
                        <div className="mb-4">
                          {isLoading || !plan ? (
                            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
                          ) : (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold tracking-tight">{formatMxn(planPrice)}</span>
                                <span className="text-sm text-muted-foreground">
                                  /{interval === "month" ? t.pricing.perMonth : t.pricing.perYear}
                                </span>
                              </div>
                              {monthlyEq && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  ≈ {formatMxn(monthlyEq)} / {t.pricing.perMonth} {t.pricing.monthlyEquivalent}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="mb-4 rounded-lg bg-accent/40 px-3 py-2 text-sm font-medium">
                          {plan ? plan.messages_included.toLocaleString(numberLocale) : "—"}{" "}
                          {t.pricing.messagesPerMonth}
                        </div>

                        <ul className="mb-6 flex-1 space-y-2.5">
                          {copy.perks.map((perk) => (
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
                            style.highlight ? "w-full bg-brand text-brand-foreground hover:bg-brand/90" : "w-full"
                          }
                          variant={style.highlight ? "default" : "outline"}
                        >
                          {pendingPlanId === plan?.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.pricing.redirecting}
                            </>
                          ) : (
                            cta
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
            <Card className="relative flex h-full flex-col overflow-hidden">
              <CardHeader>
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <CardDescription>{t.pricing.enterprise.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">{t.pricing.enterprise.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.pricing.enterprise.priceNote}</p>
                </div>

                <div className="mb-4 rounded-lg bg-accent/40 px-3 py-2 text-sm font-medium">
                  {t.pricing.enterprise.messages}
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {t.pricing.enterprise.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span className="text-muted-foreground">{perk}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="w-full">
                  <a href={ENTERPRISE_MAILTO}>
                    <Mail className="mr-2 h-4 w-4" /> {t.pricing.enterprise.cta}
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
