import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessagesSquare,
  RefreshCw,
  Send,
  UserPlus,
  Users,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createChatwootAccountForUser } from "@/lib/chatwoot/account.functions";
import { chatwootAccountSchema, type ChatwootAccountValues } from "@/lib/chatwoot/schema";
import { CHATWOOT_DEFAULT_PASSWORD } from "@/lib/chatwoot";

type FormErrors = Partial<Record<keyof ChatwootAccountValues, string>>;

const PERKS = [
  {
    icon: MessagesSquare,
    text: "Ver todas tus conversaciones de WhatsApp reunidas en un solo lugar.",
  },
  {
    icon: Wand2,
    text: "Tomar el control de un chat cuando quieras responder tú en persona.",
  },
  {
    icon: Users,
    text: "Invitar a tu equipo y darles su propio acceso.",
  },
  {
    icon: Send,
    text: "Asignar cada conversación a la persona correcta.",
  },
];

export function ChatwootAccountCard({
  userId,
  hasAccount,
  defaultEmail,
}: {
  userId: string;
  hasAccount: boolean;
  defaultEmail?: string;
}) {
  const [values, setValues] = useState<ChatwootAccountValues>({
    email: defaultEmail ?? "",
    name: "",
    companyName: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const createAccount = useServerFn(createChatwootAccountForUser);

  const mutation = useMutation({
    mutationFn: (input: ChatwootAccountValues) => createAccount({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
  });

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    } finally {
      setRefreshing(false);
    }
  }

  function setField(key: keyof ChatwootAccountValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    mutation.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = chatwootAccountSchema.safeParse(values);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ChatwootAccountValues;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    mutation.mutate(parsed.data);
  }

  if (hasAccount) {
    return (
      <Card className="border-brand/30">
        <CardHeader>
          <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Paso 1 completado
          </Badge>
          <CardTitle>Tu cuenta de la plataforma está lista</CardTitle>
          <CardDescription>
            Estos son tus datos de acceso. Ya puedes continuar con el paso 2 y conectar tu canal
            de WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Correo</p>
              <p className="break-all font-mono text-sm">{defaultEmail ?? "—"}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Contraseña temporal</p>
              <p className="font-mono text-sm">{CHATWOOT_DEFAULT_PASSWORD}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Por seguridad, cambia la contraseña{" "}
            <span className="font-mono">{CHATWOOT_DEFAULT_PASSWORD}</span> la primera vez que
            entres a la plataforma.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/30">
      <CardHeader>
        <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Paso 1
        </Badge>
        <CardTitle>Antes de continuar, creemos tu cuenta</CardTitle>
        <CardDescription>
          Con tu correo te abrimos tu cuenta en la plataforma de conversaciones: el lugar desde
          donde vas a hacer magia con los chats de tu asistente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="mb-6 space-y-2">
          {PERKS.map((perk) => (
            <li key={perk.text} className="flex items-start gap-2 text-sm text-muted-foreground">
              <perk.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              {perk.text}
            </li>
          ))}
        </ul>

        {mutation.isSuccess ? (
          <div className="space-y-4">
            <p className="flex items-start gap-2 text-sm text-brand">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {mutation.data?.message ??
                "Recibimos tu correo. Estamos creando tu cuenta; en cuanto esté lista verás aquí tus datos de acceso y se habilitará el paso 2."}
            </p>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar estado
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cw-email">Correo electrónico</Label>
              <Input
                id="cw-email"
                type="email"
                value={values.email}
                readOnly
                aria-readonly="true"
                className="bg-muted/40 font-mono"
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Usamos el mismo correo con el que entras a Larkey, así tus accesos siempre
                coinciden.
              </p>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cw-name">Nombre del usuario</Label>
                <Input
                  id="cw-name"
                  value={values.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Marlon Molina"
                  maxLength={80}
                  autoComplete="name"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cw-company-name">Nombre del negocio</Label>
                <Input
                  id="cw-company-name"
                  value={values.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  placeholder="Inmobiliaria Sonora"
                  maxLength={80}
                  autoComplete="organization"
                />
                {errors.companyName && (
                  <p className="text-xs text-destructive">{errors.companyName}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Completa tus datos y da clic en enviar; en cuanto tu cuenta esté lista te
              mostramos aquí mismo con qué contraseña entrar.
            </p>


            {mutation.isError && (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "No pudimos crear tu cuenta. Inténtalo de nuevo."}
              </p>
            )}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
