import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFacebookSdk } from "@/hooks/use-facebook-sdk";
import { completeEmbeddedSignup } from "@/lib/whatsapp/embedded-signup.functions";
import {
  embeddedSignupConfigId,
  embeddedSignupEnabled,
  embeddedSignupPendingLabel,
  type EmbeddedSignupSessionInfo,
} from "@/lib/whatsapp/embedded-signup";

/**
 * Estructura base del Embedded Signup de WhatsApp Business.
 * El botón está deshabilitado mientras `embeddedSignupEnabled` sea false
 * (app de Meta pendiente de aprobación como Tech Provider). Toda la lógica de
 * `FB.login` y del envío del `code` al backend ya queda escrita.
 */
export function EmbeddedSignupButton() {
  const { ready, error: sdkError } = useFacebookSdk(embeddedSignupEnabled);
  const [sessionInfo, setSessionInfo] = useState<EmbeddedSignupSessionInfo>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const send = useServerFn(completeEmbeddedSignup);
  const mutation = useMutation({
    mutationFn: (input: { code: string; wabaId?: string; phoneNumberId?: string }) =>
      send({ data: input }),
  });

  // Meta emite waba_id / phone_number_id vía postMessage durante el flujo.
  useEffect(() => {
    if (!embeddedSignupEnabled) return;

    function onMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com")
        return;
      try {
        const data = JSON.parse(String(event.data)) as {
          type?: string;
          event?: string;
          data?: { waba_id?: string; phone_number_id?: string };
        };
        if (data.type !== "WA_EMBEDDED_SIGNUP") return;
        if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
          setSessionInfo({
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
          });
        }
        if (data.event === "CANCEL" || data.event === "ERROR") {
          setLocalError("El registro con WhatsApp Business no se completó.");
        }
      } catch {
        // Mensajes ajenos al flujo: se ignoran.
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function launchEmbeddedSignup() {
    if (!embeddedSignupEnabled || !window.FB) return;
    setLocalError(null);

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setLocalError("No recibimos la autorización de Meta. Inténtalo de nuevo.");
          return;
        }
        mutation.mutate({
          code,
          ...(sessionInfo.wabaId ? { wabaId: sessionInfo.wabaId } : {}),
          ...(sessionInfo.phoneNumberId ? { phoneNumberId: sessionInfo.phoneNumberId } : {}),
        });
      },
      {
        config_id: embeddedSignupConfigId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      },
    );
  }

  const disabled = !embeddedSignupEnabled || !ready || mutation.isPending;
  const errorMessage =
    localError ??
    sdkError ??
    (mutation.isError
      ? mutation.error instanceof Error
        ? mutation.error.message
        : "No pudimos completar la conexión."
      : null);

  return (
    <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">Conexión rápida (recomendada)</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Autoriza tu cuenta de WhatsApp Business directamente con Meta, sin capturar IDs a
        mano.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  onClick={launchEmbeddedSignup}
                  disabled={disabled}
                  aria-disabled={disabled}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  Conectar WhatsApp Business
                </Button>
              </span>
            </TooltipTrigger>
            {!embeddedSignupEnabled && (
              <TooltipContent>{embeddedSignupPendingLabel}</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {!embeddedSignupEnabled && (
          <span className="text-xs text-muted-foreground">{embeddedSignupPendingLabel}</span>
        )}
      </div>

      {errorMessage && (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      {mutation.isSuccess && mutation.data?.ok && (
        <p className="mt-3 flex items-start gap-2 text-sm text-brand">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {mutation.data.message ?? "Recibimos la autorización. Estamos activando tu conexión."}
        </p>
      )}
    </div>
  );
}
