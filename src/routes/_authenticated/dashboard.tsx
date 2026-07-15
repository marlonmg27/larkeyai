import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageCircle, ShoppingCart, LogOut, TrendingUp, Zap } from "lucide-react";
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

// Mock data (real data reads will be wired up in the next phase)
const MOCK = {
  plan: "Pro" as const,
  messagesIncluded: 5000,
  messagesUsed: 1834,
  periodEnd: "31 de julio, 2026",
  purchases: [
    { id: "1", date: "12 jul 2026", package: "Paquete +5.000 mensajes", messages: 5000, amount: 49.0 },
    { id: "2", date: "15 jun 2026", package: "Paquete +1.000 mensajes", messages: 1000, amount: 12.0 },
    { id: "3", date: "01 jun 2026", package: "Suscripción Plan Pro", messages: 5000, amount: 49.0 },
  ],
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const remaining = MOCK.messagesIncluded - MOCK.messagesUsed;
  const pct = Math.round((MOCK.messagesUsed / MOCK.messagesIncluded) * 100);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/", replace: true });
  }

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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plan actual</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{MOCK.plan}</CardTitle>
                <Badge className="bg-brand text-brand-foreground">Activo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Renueva el {MOCK.periodEnd}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mensajes usados</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand" />
                {MOCK.messagesUsed.toLocaleString("es-ES")}
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
                {remaining.toLocaleString("es-ES")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">de {MOCK.messagesIncluded.toLocaleString("es-ES")} incluidos</p>
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
              <span>{MOCK.messagesUsed.toLocaleString("es-ES")} usados</span>
              <span>{MOCK.messagesIncluded.toLocaleString("es-ES")} totales</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historial de compras</CardTitle>
            <CardDescription>Todas tus compras y suscripciones.</CardDescription>
          </CardHeader>
          <CardContent>
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
                {MOCK.purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    <TableCell className="font-medium">{p.package}</TableCell>
                    <TableCell className="text-right">{p.messages.toLocaleString("es-ES")}</TableCell>
                    <TableCell className="text-right">{p.amount.toFixed(2)} €</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
