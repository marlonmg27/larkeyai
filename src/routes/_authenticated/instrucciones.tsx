import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAgentInstructions,
  updateAgentInstructions,
} from "@/lib/agents/instructions.functions";

const MAX_LENGTH = 8000;

export const Route = createFileRoute("/_authenticated/instrucciones")({
  component: InstructionsPage,
  head: () => ({
    meta: [
      { title: "Instrucciones del agente — Larkey" },
      {
        name: "description",
        content:
          "Edita las instrucciones que sigue tu agente de IA al responder mensajes de WhatsApp desde tu cuenta de Larkey.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Instrucciones del agente — Larkey" },
      {
        property: "og:description",
        content: "Define cómo responde tu agente de IA en WhatsApp desde el panel de Larkey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function InstructionsPage() {
  const getInstructions = useServerFn(fetchAgentInstructions);
  const saveInstructions = useServerFn(updateAgentInstructions);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agent-instructions"],
    queryFn: () => getInstructions(),
  });

  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (query.data && !loaded) {
      setDraft(query.data.instructions);
      setLoaded(true);
    }
  }, [query.data, loaded]);

  const mutation = useMutation({
    mutationFn: (instructions: string) => saveInstructions({ data: { instructions } }),
    onSuccess: (result) => {
      setDraft(result.instructions);
      queryClient.setQueryData(["agent-instructions"], result);
      toast.success("Instrucciones guardadas");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No pudimos guardar las instrucciones");
    },
  });

  const hasConnection = Boolean(query.data?.phoneNumber);
  const dirty = loaded && draft !== (query.data?.instructions ?? "");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          Instrucciones del agente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe cómo debe comportarse tu agente al responder los mensajes de WhatsApp de tus
          clientes: tono, información clave, qué debe evitar y cuándo escalar a una persona.
        </p>
      </header>

      {query.isPending ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      ) : query.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              No pudimos cargar tus instrucciones
            </CardTitle>
            <CardDescription>
              {query.error instanceof Error
                ? query.error.message
                : "Ocurrió un error inesperado al consultar el servicio del agente."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => query.refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !hasConnection ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conecta tu canal de mensajería primero</CardTitle>
            <CardDescription>
              Las instrucciones se aplican al agente asociado a tu número de WhatsApp. Conecta tu
              canal desde el panel para poder editarlas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard">Ir al panel</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instrucciones actuales</CardTitle>
            <CardDescription>
              Agente del número {query.data?.phoneNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_LENGTH}
              rows={16}
              className="min-h-[320px] resize-y font-normal leading-relaxed"
              placeholder="Ej. Eres el asistente de Inmobiliaria X. Responde en español, de forma breve y cordial…"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {draft.length} / {MAX_LENGTH} caracteres
              </span>
              <Button
                onClick={() => mutation.mutate(draft)}
                disabled={!dirty || mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
