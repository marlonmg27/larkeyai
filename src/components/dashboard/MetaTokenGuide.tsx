import { useState } from "react";
import { ArrowRight, Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { facebookAppId } from "@/lib/whatsapp/embedded-signup";

function CopyValue({ label, value }: { label: string; value: string }) {
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
    <span className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-2 pl-3">
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-mono text-sm">{value}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={copy}
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
      </Button>
    </span>
  );
}

const STEPS: { text: React.ReactNode; extra?: React.ReactNode }[] = [
  {
    text: (
      <>
        Entra a tu <span className="font-medium text-foreground">Meta Business Suite</span> y ve a{" "}
        <span className="font-medium text-foreground">Configuración</span> →{" "}
        <span className="font-medium text-foreground">Apps</span> → botón{" "}
        <span className="font-medium text-foreground">Agregar</span>.
      </>
    ),
  },
  {
    text: (
      <>
        Presiona <span className="font-medium text-foreground">Solicitar acceso</span> e ingresa el
        ID de la app de Larkey.
      </>
    ),
    extra: <CopyValue label="ID de la app Larkey" value={facebookAppId} />,
  },
  {
    text: (
      <>
        Crea un <span className="font-medium text-foreground">usuario del sistema</span> de tipo{" "}
        <span className="font-medium text-foreground">admin</span>.
      </>
    ),
  },
  {
    text: (
      <>
        Presiona <span className="font-medium text-foreground">Conectar activos</span>: selecciona
        la app <span className="font-medium text-foreground">Larkey</span> y la cuenta{" "}
        <span className="font-medium text-foreground">WABA</span> que quieres usar, y otórgale
        permisos.
      </>
    ),
  },
  {
    text: (
      <>
        Presiona <span className="font-medium text-foreground">Generar token</span> y selecciona la
        app <span className="font-medium text-foreground">Larkey</span>.
      </>
    ),
  },
  {
    text: <>Marca estos dos permisos antes de generar el token:</>,
    extra: (
      <>
        <CopyValue label="Permiso 1" value="whatsapp_business_management" />
        <CopyValue label="Permiso 2" value="whatsapp_business_messaging" />
      </>
    ),
  },
  {
    text: (
      <>
        Copia el token generado y úsalo en el campo{" "}
        <span className="font-medium text-foreground">Api Key</span> del formulario.
      </>
    ),
  },
];

export function MetaTokenGuide({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/5 p-4">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-sm text-muted-foreground">
          Antes de conectar tu WhatsApp necesitas generar un token de acceso en Meta y darle
          permisos a Larkey. Sigue estos pasos una sola vez.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-medium text-brand">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              {step.text}
              {step.extra}
            </div>
          </li>
        ))}
      </ol>

      {onContinue && (
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          Ya tengo mi token, continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
