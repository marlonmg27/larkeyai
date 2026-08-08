import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Eye,
  EyeOff,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { connectWhatsAppAccount } from "@/lib/whatsapp.functions";
import {
  whatsappOnboardingSchema,
  type MessagingChannel,
  type WhatsAppOnboardingValues,
} from "@/lib/whatsapp/schema";

const schema = whatsappOnboardingSchema;

type FormValues = WhatsAppOnboardingValues;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  channel: "whatsapp",
  displayName: "",
  userName: "",
  email: "",
  phoneNumber: "",
  phoneNumberId: "",
  wabaId: "",
  apiKey: "",
};

const CHANNELS: {
  id: MessagingChannel;
  label: string;
  description: string;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Conecta tu WhatsApp Business API para que tu asistente responda.",
  },
];

export function WhatsAppOnboardingCard({
  userId,
  status,
}: {
  userId: string;
  status?: string | null;
}) {
  const [channel, setChannel] = useState<MessagingChannel | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showKey, setShowKey] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const connect = useServerFn(connectWhatsAppAccount);

  const mutation = useMutation({
    mutationFn: (input: FormValues) => connect({ data: input }),
    onSuccess: () => {
      setValues((v) => ({ ...v, apiKey: "" }));
      setShowKey(false);
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

  function setField(key: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    mutation.reset();
  }

  function selectChannel(id: MessagingChannel) {
    setChannel(id);
    setValues((v) => ({ ...v, channel: id }));
    setErrors({});
    mutation.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    mutation.mutate(parsed.data);
  }

  // Verificación en curso: no mostramos el formulario para que no se reenvíen los mismos datos.
  if (status === "pending") {
    return (
      <Card className="border-brand/30">
        <CardHeader>
          <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> En verificación
          </Badge>
          <CardTitle>Estamos verificando tu conexión…</CardTitle>
          <CardDescription>
            Ya recibimos tus credenciales de WhatsApp Business. Esto puede tardar unos
            minutos; en cuanto quede lista, esta sección se actualizará automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar estado
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/30">
      <CardHeader>
        <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Paso pendiente
        </Badge>
        <CardTitle>Conecta tu canal de mensajería</CardTitle>
        <CardDescription>
          {channel
            ? "Completa los datos del canal para que tu asistente empiece a responder. Guardamos estas credenciales de forma segura."
            : "Elige el canal que quieres conectar para empezar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "error" && (
          <p className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            No pudimos verificar tu conexión anterior. Revisa que el Phone number ID, el WABA
            ID y la API Key sean correctos e inténtalo de nuevo.
          </p>
        )}

        {!channel && (
          <ul className="space-y-3">
            {CHANNELS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectChannel(c.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-brand/50 hover:bg-brand/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{c.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {c.description}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {channel === "whatsapp" && (
          <>
            <button
              type="button"
              onClick={() => setChannel(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Cambiar de canal
            </button>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wa-display-name">Nombre del negocio</Label>
                <Input
                  id="wa-display-name"
                  value={values.displayName}
                  onChange={(e) => setField("displayName", e.target.value)}
                  placeholder="Inmobiliaria Sonora"
                  maxLength={80}
                  autoComplete="organization"
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wa-user-name">Nombre del usuario</Label>
                <Input
                  id="wa-user-name"
                  value={values.userName}
                  onChange={(e) => setField("userName", e.target.value)}
                  placeholder="Marlon Molina"
                  maxLength={80}
                  autoComplete="name"
                />
                {errors.userName && <p className="text-xs text-destructive">{errors.userName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wa-email">Email</Label>
                <Input
                  id="wa-email"
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
                <Label htmlFor="wa-phone-number">Phone number</Label>
                <Input
                  id="wa-phone-number"
                  type="tel"
                  value={values.phoneNumber}
                  onChange={(e) => setField("phoneNumber", e.target.value)}
                  placeholder="+52 662 123 4567"
                  maxLength={20}
                  autoComplete="tel"
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wa-phone-number-id">Phone number ID</Label>
                <Input
                  id="wa-phone-number-id"
                  value={values.phoneNumberId}
                  onChange={(e) => setField("phoneNumberId", e.target.value)}
                  placeholder="123456789012345"
                  maxLength={64}
                  inputMode="numeric"
                />
                {errors.phoneNumberId && (
                  <p className="text-xs text-destructive">{errors.phoneNumberId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wa-waba-id">WABA ID</Label>
                <Input
                  id="wa-waba-id"
                  value={values.wabaId}
                  onChange={(e) => setField("wabaId", e.target.value)}
                  placeholder="WhatsApp Business Account ID"
                  maxLength={64}
                />
                {errors.wabaId && <p className="text-xs text-destructive">{errors.wabaId}</p>}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="wa-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="wa-api-key"
                    type={showKey ? "text" : "password"}
                    value={values.apiKey}
                    onChange={(e) => setField("apiKey", e.target.value)}
                    placeholder="••••••••••••"
                    maxLength={512}
                    autoComplete="off"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    aria-label={showKey ? "Ocultar API Key" : "Mostrar API Key"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.apiKey && <p className="text-xs text-destructive">{errors.apiKey}</p>}
              </div>

              <div className="space-y-3 sm:col-span-2">
                {mutation.isError && (
                  <p className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "No pudimos guardar la conexión. Inténtalo de nuevo."}
                  </p>
                )}
                {mutation.isSuccess && (
                  <p className="flex items-start gap-2 text-sm text-brand">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {mutation.data?.message ??
                      "Recibimos tus datos. Estamos activando tu conexión de WhatsApp."}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mutation.isPending ? "Conectando…" : "Guardar conexión"}
                </Button>
              </div>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
