import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  displayName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre de tu negocio" })
    .max(80, { message: "Máximo 80 caracteres" }),
  phoneNumberId: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el Phone number ID" })
    .max(64, { message: "Máximo 64 caracteres" }),
  wabaId: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el WABA ID" })
    .max(64, { message: "Máximo 64 caracteres" }),
  accessToken: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el access token" })
    .max(512, { message: "Máximo 512 caracteres" }),
});

type FormValues = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = { displayName: "", phoneNumberId: "", wabaId: "", accessToken: "" };

function maskToken(token: string) {
  const trimmed = token.trim();
  return `***${trimmed.slice(-4)} (longitud: ${trimmed.length})`;
}

export function WhatsAppOnboardingCard() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showToken, setShowToken] = useState(false);

  function setField(key: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
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

    // TODO: conectar al backend. Por ahora solo log, con el token enmascarado.
    console.log("[WhatsApp onboarding]", {
      displayName: parsed.data.displayName,
      phoneNumberId: parsed.data.phoneNumberId,
      wabaId: parsed.data.wabaId,
      accessToken: maskToken(parsed.data.accessToken),
    });
  }

  return (
    <Card className="border-brand/30">
      <CardHeader>
        <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Paso pendiente
        </Badge>
        <CardTitle>Conecta tu WhatsApp</CardTitle>
        <CardDescription>
          Ingresa los datos de tu WhatsApp Business API para que tu asistente empiece a
          responder. Guardamos estas credenciales de forma segura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wa-display-name">Nombre a mostrar del negocio</Label>
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

          <div className="space-y-2">
            <Label htmlFor="wa-access-token">Access token</Label>
            <div className="relative">
              <Input
                id="wa-access-token"
                type={showToken ? "text" : "password"}
                value={values.accessToken}
                onChange={(e) => setField("accessToken", e.target.value)}
                placeholder="••••••••••••"
                maxLength={512}
                autoComplete="off"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                aria-label={showToken ? "Ocultar access token" : "Mostrar access token"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.accessToken && (
              <p className="text-xs text-destructive">{errors.accessToken}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
              Guardar conexión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
