import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelSubscription, resumeSubscription } from "@/lib/billing.functions";
import { toast } from "sonner";

export function SubscriptionActions({
  cancelAtPeriodEnd,
  periodEnd,
}: {
  cancelAtPeriodEnd: boolean;
  periodEnd?: string | null;
}) {
  const [pending, setPending] = useState<"cancel" | "resume" | null>(null);
  const cancelFn = useServerFn(cancelSubscription);
  const resumeFn = useServerFn(resumeSubscription);
  const qc = useQueryClient();

  async function run(action: "cancel" | "resume") {
    setPending(action);
    try {
      if (action === "cancel") await cancelFn({});
      else await resumeFn({});
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(action === "cancel" ? "Suscripción programada para cancelar" : "Suscripción reanudada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Acción no disponible");
    } finally {
      setPending(null);
    }
  }

  if (cancelAtPeriodEnd) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
        <span className="text-muted-foreground">
          Tu plan se cancelará {periodEnd ? `el ${new Date(periodEnd).toLocaleDateString("es-MX")}` : "al final del periodo"}.
        </span>
        <Button size="sm" variant="outline" disabled={pending === "resume"} onClick={() => run("resume")}>
          {pending === "resume" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-2 h-3.5 w-3.5" />}
          Reactivar
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      disabled={pending === "cancel"}
      onClick={() => run("cancel")}
    >
      {pending === "cancel" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-2 h-3.5 w-3.5" />}
      Cancelar suscripción
    </Button>
  );
}
