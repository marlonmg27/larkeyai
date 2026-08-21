import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { connectWhatsAppAccount } from "@/lib/whatsapp.functions";
import { PhoneField } from "@/components/dashboard/PhoneField";
import { EmbeddedSignupButton } from "@/components/dashboard/EmbeddedSignupButton";



import {
  defaultCountry,
  toE164,
  validateNationalNumber,
  type Country,
} from "@/lib/phone/countries";
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
  accessToken: "",
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
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  

  const queryClient = useQueryClient();
  const connect = useServerFn(connectWhatsAppAccount);
  const [verificationError, setVerificationError] = useState<{
    field: string | null;
    message: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: (input: FormValues) => connect({ data: input }),
    onSuccess: (result) => {
      if (result && "verification" in result && result.verification) {
        const { field, message } = result.verification;
        setVerificationError({ field: field ?? null, message });
        if (field) setErrors((e) => ({ ...e, [field]: message }));
        return;
      }
      setVerificationError(null);
      void queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
    },
  });

  const isVerified = mutation.isSuccess && !verificationError;



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
    setVerificationError(null);


    const phoneError = validateNationalNumber(country, nationalNumber);
    const parsed = schema.safeParse({ ...values, phoneNumber: toE164(country, nationalNumber) });

    if (!parsed.success || phoneError) {
      const next: FormErrors = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof FormValues;
          if (!next[key]) next[key] = issue.message;
        }
      }
      if (phoneError) next.phoneNumber = phoneError;
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

  // Datos enviados: mostramos la guía para entrar y configurar su plataforma.
  if (isVerified) {
    return (
      <Card className="border-brand/30">
        <CardHeader>
          <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Conexión enviada
          </Badge>
          <CardTitle>Recibimos tus datos</CardTitle>
          <CardDescription>
            {mutation.data?.message ??
              "Estamos activando tu conexión de WhatsApp. Abajo encontrarás el acceso y los pasos de tu plataforma de conversaciones."}
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
            No pudimos verificar tu conexión anterior. Revisa que el Phone number ID y el
            WABA ID sean correctos e inténtalo de nuevo.
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

            {!guideDone ? (
              <MetaTokenGuide onContinue={() => setGuideDone(true)} />
            ) : (
              <>
            <EmbeddedSignupButton />

            <div className="mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                o conecta manualmente
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
              <CollapsibleTrigger className="mb-4 flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left text-sm font-medium transition-colors hover:bg-muted/60">
                <span>Ver la guía otra vez</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${guideOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mb-6 pt-2">
                <MetaTokenGuide />
              </CollapsibleContent>
            </Collapsible>

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

              <PhoneField
                country={country}
                onCountryChange={(c) => {
                  setCountry(c);
                  setErrors((e) => ({ ...e, phoneNumber: undefined }));
                  mutation.reset();
                }}
                nationalNumber={nationalNumber}
                onNationalNumberChange={(v) => {
                  setNationalNumber(v);
                  setErrors((e) => ({ ...e, phoneNumber: undefined }));
                  mutation.reset();
                }}
                error={errors.phoneNumber}
              />

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
                <Label htmlFor="wa-api-key">Api Key</Label>
                <div className="relative">
                  <Input
                    id="wa-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={values.accessToken}
                    onChange={(e) => setField("accessToken", e.target.value)}
                    placeholder="Token permanente de tu app de Meta"
                    maxLength={512}
                    autoComplete="off"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    aria-label={showApiKey ? "Ocultar Api Key" : "Mostrar Api Key"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  La encuentras en tu app de Meta, en WhatsApp → API Setup. La guardamos de forma
                  segura.
                </p>
                {errors.accessToken && (
                  <p className="text-xs text-destructive">{errors.accessToken}</p>
                )}
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
                {/* Error de verificación con Graph API (desactivada temporalmente):
                {verificationError && !verificationError.field && (
                  <p className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {verificationError.message}
                  </p>
                )} */}

                {isVerified && (
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
