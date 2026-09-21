import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import Nango from "@nangohq/frontend";
import { CalendarDays, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createNangoConnectSession } from "@/lib/connectors/google-calendar.functions";

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

function GoogleCalendarConnectorPage() {
  const createSession = useServerFn(createNangoConnectSession);

  const openNangoMutation = useMutation({
    mutationFn: async () => {
      const nango = new Nango();
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          if (event.type === "connect") {
            toast.success("Integración actualizada con éxito");
          }
        },
      });
      const { sessionToken } = await createSession();
      connect.setSessionToken(sessionToken);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conectores</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Google Calendar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conecta tu calendario personal para que tus agentes de IA puedan agendar citas automáticamente.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-primary" />
            Integración de Google Calendar
          </CardTitle>
          <CardDescription>
            Administra la conexión con tu cuenta de Google Calendar mediante Nango.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button
            onClick={() => openNangoMutation.mutate()}
            disabled={openNangoMutation.isPending}
          >
            {openNangoMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Gestionar conexión en Nango
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
