import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Nango from "@nangohq/frontend";
import { CalendarDays, Loader2, Plus, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createGoogleCalendarTestEvent,
  createNangoConnectSession,
  disconnectGoogleCalendar,
  listGoogleCalendarEvents,
} from "@/lib/connectors/google-calendar.functions";

export const Route = createFileRoute("/_authenticated/connectors/google-calendar")({
  head: () => ({
    meta: [
      { title: "Google Calendar — Larkey" },
      { name: "description", content: "Conecta tu Google Calendar con Larkey." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GoogleCalendarConnectorPage,
});

function formatEventDate(value: string | null, allDay: boolean): string {
  if (!value) return "Sin fecha";
  const date = new Date(allDay ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  if (allDay) {
    return `${date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "long" })} · todo el día`;
  }
  return date.toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GoogleCalendarConnectorPage() {
  const queryClient = useQueryClient();
  const listEvents = useServerFn(listGoogleCalendarEvents);
  const createSession = useServerFn(createNangoConnectSession);
  const createEvent = useServerFn(createGoogleCalendarTestEvent);
  const disconnect = useServerFn(disconnectGoogleCalendar);

  const eventsQuery = useQuery({
    queryKey: ["google-calendar", "events"],
    queryFn: () => listEvents(),
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const nango = new Nango();
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          if (event.type === "connect") {
            void queryClient.invalidateQueries({ queryKey: ["google-calendar"] });
            toast.success("Google Calendar conectado");
          }
        },
      });
      const { sessionToken } = await createSession();
      connect.setSessionToken(sessionToken);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMutation = useMutation({
    mutationFn: () => createEvent(),
    onSuccess: async (result) => {
      if (!result.connected) {
        toast.error("Tu acceso a Google necesita renovarse. Vuelve a conectar.");
      } else {
        toast.success("Evento de prueba creado (30 minutos)");
      }
      await queryClient.invalidateQueries({ queryKey: ["google-calendar"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["google-calendar"] });
      toast.success("Google Calendar desconectado");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const data = eventsQuery.data;
  const connected = data?.connected === true;
  const reconnectRequired = data?.connected === false && data.reconnectRequired === true;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connectors</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Google Calendar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conecta tu cuenta de Google para ver tus próximos eventos y crear eventos de prueba.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            {connected ? "Cuenta conectada" : "Conecta tu cuenta"}
          </CardTitle>
          <CardDescription>
            {connected
              ? "Estos son tus próximos 10 eventos."
              : reconnectRequired
                ? "Tu acceso a Google necesita renovarse."
                : "Autoriza a Larkey para leer y crear eventos en tu calendario."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {connected ? (
              <>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Crear evento de prueba
                </Button>
                <Button
                  variant="outline"
                  onClick={() => eventsQuery.refetch()}
                  disabled={eventsQuery.isFetching}
                >
                  <RefreshCw className={`h-4 w-4 ${eventsQuery.isFetching ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <Unplug className="h-4 w-4" />
                  Desconectar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                {reconnectRequired ? "Volver a conectar Google Calendar" : "Conectar Google Calendar"}
              </Button>
            )}
          </div>

          {eventsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : eventsQuery.isError ? (
            <p className="text-sm text-destructive">
              {(eventsQuery.error as Error).message || "No pudimos cargar tus eventos."}
            </p>
          ) : connected ? (
            data.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes eventos próximos.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {data.events.map((event) => (
                  <li key={event.id} className="flex flex-col gap-1 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatEventDate(event.start, event.allDay)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
