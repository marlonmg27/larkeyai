import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createChatwootAccountForUser } from "@/lib/chatwoot/account.functions";
import { chatwootAccountSchema, type ChatwootAccountValues } from "@/lib/chatwoot/schema";

type FormErrors = Partial<Record<keyof ChatwootAccountValues, string>>;

const EMPTY: ChatwootAccountValues = { email: "", password: "", confirmPassword: "" };

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
    ...EMPTY,
    email: defaultEmail ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const createAccount = useServerFn(createChatwootAccountForUser);

  const mutation = useMutation({
    mutationFn: (input: ChatwootAccountValues) => createAccount({ data: input }),
    onSuccess: () => {
      setValues((v) => ({ ...v, password: "", confirmPassword: "" }));
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
            Ya puedes continuar con el paso 2 y conectar tu canal de WhatsApp.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-brand/30">
      <CardHeader>
        <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Paso 1
        </Badge>
        <CardTitle>Crea tu cuenta de la plataforma de conversaciones</CardTitle>
        <CardDescription>
          Con estos datos crearemos tu cuenta y tu usuario para que ahí puedas ver y responder
          los chats de tu asistente. Úsalos después para iniciar sesión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <div className="space-y-4">
            <p className="flex items-start gap-2 text-sm text-brand">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {mutation.data?.message ??
                "Recibimos tus datos. Estamos creando tu cuenta; en cuanto esté lista se habilitará el paso 2."}
            </p>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar estado
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cw-email">Email</Label>
              <Input
                id="cw-email"
                type="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="contacto@tunegocio.com"
                maxLength={160}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cw-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="cw-password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  maxLength={128}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cw-confirm">Confirmar contraseña</Label>
              <Input
                id="cw-confirm"
                type={showPassword ? "text" : "password"}
                value={values.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                placeholder="Repite la contraseña"
                maxLength={128}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-3 sm:col-span-2">
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
                {mutation.isPending ? "Creando cuenta…" : "Crear mi cuenta"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
