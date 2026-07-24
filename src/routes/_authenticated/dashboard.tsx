import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  LogOut,
  TrendingUp,
  Zap,
  AlertCircle,
  Sparkles,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PlansShowcase } from "@/components/dashboard/PlansShowcase";
import { PacksSection } from "@/components/dashboard/PacksSection";
import { SubscriptionActions } from "@/components/dashboard/SubscriptionActions";
import { LarkeyMark } from "@/components/brand/LarkeyMark";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Larkey" },
      { name: "description", content: "Gestiona tu plan, uso de mensajes y compras en Larkey." },
    ],
  }),
});

type DashboardData = {
  plan: { name: string; price: number; messagesIncluded: number; interval: string } | null;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  };
  balance: { messagesRemaining: number; messagesUsed: number; periodEnd: string } | null;
  purchases: Array<{
    id: string;
    created_at: string;
    package: string;
    messages_purchased: number;
    amount: number;
  }>;
};

async function fetchDashboard(userId: string): Promise<DashboardData> {
  const [profileRes, balanceRes, purchasesRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "plan_id, subscription_status, cancel_at_period_end, trial_ends_at, current_period_end, plans:plan_id(name, price, messages_included, billing_interval)",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("usage_balance")
      .select("messages_remaining, messages_used_period, period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("purchases")
      .select("id, created_at, package, messages_purchased, amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (balanceRes.error) throw balanceRes.error;
  if (purchasesRes.error) throw purchasesRes.error;

  const planRow = (profileRes.data?.plans ?? null) as
    | { name: string; price: number; messages_included: number; billing_interval: string }
    | null;

  return {
    plan: planRow
      ? {
          name: planRow.name,
          price: Number(planRow.price),
          messagesIncluded: planRow.messages_included,
          interval: planRow.billing_interval,
        }
      : null,
    subscription: {
      status: profileRes.data?.subscription_status ?? "none",
      cancelAtPeriodEnd: profileRes.data?.cancel_at_period_end ?? false,
      trialEndsAt: profileRes.data?.trial_ends_at ?? null,
      currentPeriodEnd: profileRes.data?.current_period_end ?? null,
    },
    balance: balanceRes.data
      ? {
          messagesRemaining: balanceRes.data.messages_remaining,
          messagesUsed: balanceRes.data.messages_used_period,
          periodEnd: balanceRes.data.period_end,
        }
      : null,
    purchases: purchasesRes.data ?? [],
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function planLabel(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatMxn(v: number, interval: string) {
  const s = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);
  return `${s} / ${interval === "year" ? "año" : "mes"}`;
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: () => fetchDashboard(user.id),
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/", replace: true });
  }

  const included = data?.plan?.messagesIncluded ?? 0;
  const used = data?.balance?.messagesUsed ?? 0;
  const remaining = data?.balance?.messagesRemaining ?? 0;
  const total = included > 0 ? included : used + remaining;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const isTrial = data?.subscription.status === "trialing" && data?.subscription.trialEndsAt;
  const noBalance = !isLoading && !data?.balance;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="section-container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LarkeyMark className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">Larkey</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="section-container py-8">
        {isError ? (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" /> No pudimos cargar tus datos
              </CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : "Intenta recargar la página."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : noBalance ? (
          <LeadOnboarding email={user?.email ?? ""} />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Tu dashboard</h1>
              <p className="mt-1 text-muted-foreground">Resumen de tu plan y uso de mensajes.</p>
            </div>

            {isTrial && data?.subscription.trialEndsAt && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/15 text-brand">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estás en prueba gratis</p>
                    <p className="text-xs text-muted-foreground">
                      Termina el {formatDate(data.subscription.trialEndsAt)}. Agrega un método de pago para no perder el servicio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Plan actual</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {isLoading ? <Skeleton className="h-7 w-20" /> : planLabel(data?.plan?.name ?? "—")}
                    </CardTitle>
                    <Badge className="bg-brand text-brand-foreground">
                      {data?.subscription.status === "trialing" ? "Trial" : "Activo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {data?.plan ? formatMxn(data.plan.price, data.plan.interval) : "Sin plan asignado"}
                      {data?.balance ? ` · Renueva el ${formatDate(data.balance.periodEnd)}` : ""}
                    </p>
                  )}
                  {data && (
                    <div className="mt-3">
                      <SubscriptionActions
                        cancelAtPeriodEnd={data.subscription.cancelAtPeriodEnd}
                        periodEnd={data.subscription.currentPeriodEnd}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mensajes usados</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <TrendingUp className="h-5 w-5 text-brand" />
                    {isLoading ? <Skeleton className="h-7 w-16" /> : used.toLocaleString("es-MX")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Este período de facturación</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mensajes restantes</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Zap className="h-5 w-5 text-brand" />
                    {isLoading ? <Skeleton className="h-7 w-16" /> : remaining.toLocaleString("es-MX")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    de {included.toLocaleString("es-MX")} incluidos
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>Consumo del período</CardTitle>
                    <CardDescription>Has usado {pct}% de tu cuota mensual.</CardDescription>
                  </div>
                  <Button
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() => {
                      document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Comprar más mensajes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={pct} className="h-3" />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{used.toLocaleString("es-MX")} usados</span>
                  <span>{total.toLocaleString("es-MX")} totales</span>
                </div>
              </CardContent>
            </Card>

            <div id="packs" className="mt-6 scroll-mt-24">
              <PacksSection />
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Historial de compras</CardTitle>
                <CardDescription>Todas tus compras y suscripciones.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : data && data.purchases.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Paquete</TableHead>
                        <TableHead className="text-right">Mensajes</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                          <TableCell className="font-medium">{p.package}</TableCell>
                          <TableCell className="text-right">
                            {p.messages_purchased.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                              maximumFractionDigits: 0,
                            }).format(Number(p.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Aún no tienes compras registradas.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function LeadOnboarding({ email }: { email: string }) {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/10 via-background to-background p-8 md:p-12"
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-brand/15 text-brand hover:bg-brand/15">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Bienvenido a Larkey
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Falta un paso para activar tu asistente
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tu cuenta <span className="font-medium text-foreground">{email}</span> está lista.
            Elige un plan y empieza con 14 días de prueba gratis — sin tarjeta requerida.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { n: "1", t: "Elige un plan", d: "Basic, Standard o Pro" },
              { n: "2", t: "Prueba 14 días", d: "Sin tarjeta, sin compromiso" },
              { n: "3", t: "Conecta WhatsApp", d: "Te acompañamos en el setup" },
            ].map((s) => (
              <div key={s.n} className="rounded-lg border border-border bg-background/60 p-3">
                <div className="mb-1 grid h-6 w-6 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                  {s.n}
                </div>
                <p className="text-sm font-medium">{s.t}</p>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <PlansShowcase />

      <p className="text-center text-xs text-muted-foreground">
        ¿Necesitas algo a medida o eres un cliente existente?{" "}
        <a href="mailto:marlonmolinag@hotmail.com" className="text-brand underline-offset-4 hover:underline">
          Escríbenos
        </a>
        .
      </p>
    </div>
  );
}
