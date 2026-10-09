import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createBillingPortalSession } from "@/lib/billing.functions";

export function PaymentFailedAlert() {
  const openPortal = useServerFn(createBillingPortalSession);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { url } = await openPortal();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos abrir el portal de pagos.");
      setLoading(false);
    }
  }

  return (
    <Alert variant="destructive" className="rounded-xl">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Pago pendiente</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          No pudimos cobrar tu suscripción. Actualiza tu método de pago para que tu asistente siga funcionando.
        </span>
        <Button
          variant="destructive"
          size="sm"
          className="shrink-0 transition-all duration-200 active:scale-95"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Actualizar tarjeta
        </Button>
      </AlertDescription>
    </Alert>
  );
}
