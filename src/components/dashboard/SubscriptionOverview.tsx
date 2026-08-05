import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, CreditCard, MessageSquare, ShieldCheck } from "lucide-react";

export type SubscriptionOverviewProps = {
  isLoading: boolean;
  planName: string | null;
  planPrice: number | null;
  planInterval: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  messagesRemaining: number | null;
  messagesIncluded: number | null;
  balancePeriodEnd: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function statusMeta(status: string, cancelAtPeriodEnd: boolean) {
  switch (status) {
    case "active":
      return cancelAtPeriodEnd
        ? { label: "Activa (se cancela al final del período)", variant: "secondary" as const }
        : { label: "Activa", variant: "default" as const };
    case "trialing":
      return { label: "Prueba gratis", variant: "default" as const };
    case "past_due":
      return { label: "Vencida — pago pendiente", variant: "destructive" as const };
    case "canceled":
      return { label: "Cancelada", variant: "destructive" as const };
    default:
      return { label: "Inactiva", variant: "secondary" as const };
  }
}

export function SubscriptionOverview(props: SubscriptionOverviewProps) {
  const {
    isLoading,
    planName,
    planPrice,
    planInterval,
    status,
    cancelAtPeriodEnd,
    trialEndsAt,
    currentPeriodEnd,
    messagesRemaining,
    messagesIncluded,
    balancePeriodEnd,
  } = props;

  const hasSubscription = !isLoading && Boolean(planName) && status !== "none";
  const meta = statusMeta(status, cancelAtPeriodEnd);
  const renewal = currentPeriodEnd ?? trialEndsAt ?? balancePeriodEnd ?? null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!hasSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu suscripción</CardTitle>
          <CardDescription>
            Aún no tienes una suscripción activa. Al elegir un plan verás aquí tu estado, el
            balance de mensajes de tu bot y la fecha de renovación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Badge variant="secondary">Sin suscripción</Badge>
            <span>Plan: — · Balance: — · Renovación: —</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      icon: ShieldCheck,
      label: "Plan actual",
      value: planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : "—",
      hint:
        planPrice != null
          ? `${new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN",
              maximumFractionDigits: 0,
            }).format(planPrice)} / ${planInterval === "year" ? "año" : "mes"}`
          : null,
    },
    {
      icon: CreditCard,
      label: "Estado de la suscripción",
      value: meta.label,
      hint: null,
    },
    {
      icon: MessageSquare,
      label: "Balance del bot",
      value:
        messagesRemaining != null ? `${messagesRemaining.toLocaleString("es-MX")} mensajes` : "—",
      hint:
        messagesIncluded && messagesIncluded > 0
          ? `de ${messagesIncluded.toLocaleString("es-MX")} incluidos`
          : null,
    },
    {
      icon: CalendarClock,
      label: cancelAtPeriodEnd ? "Termina el" : "Próxima renovación",
      value: renewal ? formatDate(renewal) : "Sin fecha registrada",
      hint: status === "trialing" && trialEndsAt ? "Fin de la prueba gratis" : null,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Tu suscripción</CardTitle>
            <CardDescription>Resumen de tu plan, estado y balance actual.</CardDescription>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <it.icon className="h-4 w-4 text-brand" />
              {it.label}
            </div>
            <p className="mt-2 text-base font-semibold tracking-tight">{it.value}</p>
            {it.hint && <p className="mt-0.5 text-xs text-muted-foreground">{it.hint}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
