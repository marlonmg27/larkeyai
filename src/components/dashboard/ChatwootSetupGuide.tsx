import { useState } from "react";
import { CheckCircle2, Copy, Check, ExternalLink, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CHATWOOT_DEFAULT_PASSWORD,
  CHATWOOT_FRONTEND_URL,
  CHATWOOT_LOGIN_URL,
} from "@/lib/chatwoot";
import settingsInboxesImg from "@/assets/chatwoot-settings-inboxes.jpg";
import addWhatsappInboxImg from "@/assets/chatwoot-add-whatsapp-inbox.jpg";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label={`Copiar ${label}`}>
        {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

const INBOX_FIELDS: { name: string; help: string }[] = [
  {
    name: "Inbox Name",
    help: "El nombre visible de tu negocio, por ejemplo “Inmobiliaria Sonora”.",
  },
  {
    name: "Phone Number",
    help: "Tu número de WhatsApp en formato internacional, con código de país (+52…).",
  },
  {
    name: "Phone number ID",
    help: "El identificador del número que aparece en tu panel de Meta (WhatsApp → API Setup).",
  },
  {
    name: "Business Account ID",
    help: "El WABA ID de tu WhatsApp Business Account, también en el panel de Meta.",
  },
  {
    name: "API Key",
    help: "El access token permanente de tu app de Meta. Es el mismo dato que capturaste aquí como “Api Key”.",
  },
];

function defaultMessage(status?: string | null) {
  if (status === "connected") return "Tu WhatsApp está conectado a tu plataforma de conversaciones.";
  if (status === "error")
    return "Hubo un problema con tu conexión de WhatsApp. Puedes reintentarlo desde la plataforma.";
  if (status === "pending") return "Estamos activando tu conexión de WhatsApp.";
  return "Recibimos tus datos y estamos activando tu conexión de WhatsApp.";
}

export function ChatwootSetupGuide({
  email,
  message,
  status,
}: {
  email: string;
  message?: string | null;
  status?: string | null;
}) {
  const [open, setOpen] = useState(status === "error");

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-brand/30 bg-brand/5 p-4">
        <p className="flex items-start gap-2 text-sm font-medium text-brand">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message ?? defaultMessage(status)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Para ver y monitorear tus conversaciones, sigue estos pasos.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">1. Tus credenciales de acceso</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <CopyField label="Email" value={email} />
          <CopyField label="Contraseña temporal" value={CHATWOOT_DEFAULT_PASSWORD} />
        </div>
        <p className="text-sm text-muted-foreground">
          Al entrar, cambia la contraseña <span className="font-mono">{CHATWOOT_DEFAULT_PASSWORD}</span>{" "}
          por una tuya desde tu perfil.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">2. Entra a la plataforma</h3>
        <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <a href={CHATWOOT_LOGIN_URL} target="_blank" rel="noopener noreferrer">
            Entrar a mi plataforma de conversaciones
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <p className="break-all text-xs text-muted-foreground">{CHATWOOT_FRONTEND_URL}/app/login</p>
      </section>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left text-sm font-medium transition-colors hover:bg-muted/60">
          <span>Si tu inbox falló o no llegan los mensajes</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Si hubo un error al crear tu inbox o tu WhatsApp Business Account no recibe mensajes,
            puedes intentarlo de nuevo directamente desde la plataforma.
          </p>
          <p className="text-sm text-muted-foreground">
            En la barra lateral ve a <span className="font-medium text-foreground">Settings</span> →{" "}
            <span className="font-medium text-foreground">Inboxes</span> y presiona el botón{" "}
            <span className="font-medium text-foreground">Add Inbox</span>. Elige el canal{" "}
            <span className="font-medium text-foreground">WhatsApp</span>.
          </p>
          <img
            src={settingsInboxesImg}
            alt="Barra lateral con Settings seleccionado, sección Inboxes y el botón Add Inbox arriba a la derecha"
            loading="lazy"
            width={1280}
            height={800}
            className="w-full rounded-lg border border-border"
          />
          <ul className="space-y-3">
            {INBOX_FIELDS.map((f) => (
              <li key={f.name} className="rounded-lg border border-border bg-background/60 p-3">
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-sm text-muted-foreground">{f.help}</p>
              </li>
            ))}
          </ul>
          <img
            src={addWhatsappInboxImg}
            alt="Formulario para crear un canal de WhatsApp con los campos Inbox Name, Phone Number, Phone number ID, Business Account ID y API Key"
            loading="lazy"
            width={1280}
            height={800}
            className="w-full rounded-lg border border-border"
          />
          <p className="text-sm text-muted-foreground">
            Si tu app de Meta aún no está aprobada, este paso puede fallar. En ese caso escríbenos y
            lo revisamos contigo.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
