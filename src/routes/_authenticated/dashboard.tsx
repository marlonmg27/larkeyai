import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, ShoppingCart, LogOut, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
  plan: { name: string; price: number; messagesIncluded: number } | null;
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
      .from("profiles")
      .select("plan_id, plans:plan_id(name, price, messages_included)")
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
    | { name: string; price: number; messages_included: number }
    | null;

  return {
    plan: planRow
      ? { name: planRow.name, price: Number(planRow.price), messagesIncluded: planRow.messages_included }
      : null,
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
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function planLabel(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="section-container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
              <MessageCircle className="h-5 w-5" />
            </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Tu dashboard</h1>
          <p className="mt-1 text-muted-foreground">Resumen de tu plan y uso de mensajes.</p>
        </div>

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
        ) : !isLoading && !data?.balance ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-brand" /> No active plan
              </CardTitle>
              <CardDescription>
                You don't have an active plan yet — contact us to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                <a href="mailto:hola@larkey.ai?subject=Activate%20my%20Larkey%20account">
                  Contact us
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (

          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Plan actual</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {isLoading ? <Skeleton className="h-7 w-20" /> : planLabel(data?.plan?.name ?? "—")}
                    </CardTitle>
                    <Badge className="bg-brand text-brand-foreground">Activo</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {data?.plan ? `${data.plan.price.toFixed(2)} € / mes` : "Sin plan asignado"}
                      {data?.balance ? ` · Renueva el ${formatDate(data.balance.periodEnd)}` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mensajes usados</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand" />
                    {isLoading ? <Skeleton className="h-7 w-16" /> : used.toLocaleString("es-ES")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Este período de facturación</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mensajes restantes</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Zap className="h-5 w-5 text-brand" />
                    {isLoading ? <Skeleton className="h-7 w-16" /> : remaining.toLocaleString("es-ES")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    de {included.toLocaleString("es-ES")} incluidos
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
                    onClick={() => toast.info("La compra de paquetes estará disponible pronto.")}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Comprar más mensajes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={pct} className="h-3" />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{used.toLocaleString("es-ES")} usados</span>
                  <span>{total.toLocaleString("es-ES")} totales</span>
                </div>
              </CardContent>
            </Card>

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
                            {p.messages_purchased.toLocaleString("es-ES")}
                          </TableCell>
                          <TableCell className="text-right">{Number(p.amount).toFixed(2)} €</TableCell>
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
