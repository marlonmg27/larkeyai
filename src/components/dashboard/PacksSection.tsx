import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Package, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPackCheckout } from "@/lib/billing.functions";
import { toast } from "sonner";

type Pack = {
  id: string;
  code: string;
  name: string;
  messages: number;
  price_mxn: number;
};

function formatMxn(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v);
}

export function PacksSection() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const checkout = useServerFn(createPackCheckout);

  const { data: packs, isLoading } = useQuery<Pack[]>({
    queryKey: ["message-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_packs")
        .select("id, code, name, messages, price_mxn")
        .eq("active", true)
        .order("messages", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pack[];
    },
  });

  async function handleBuy(packId: string) {
    setPendingId(packId);
    try {
      const { url } = await checkout({ data: { packId } });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos iniciar la compra.");
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-brand" /> Paquetes de mensajes adicionales
        </CardTitle>
        <CardDescription>
          Compra mensajes extra sin cambiar de plan. Se suman a tu saldo actual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
              ))
            : (packs ?? []).map((pack) => (
                <div
                  key={pack.id}
                  className="flex flex-col rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-2 text-sm font-medium text-muted-foreground">{pack.name}</div>
                  <div className="text-2xl font-bold tracking-tight">
                    {pack.messages.toLocaleString("es-MX")}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">mensajes</span>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-brand">{formatMxn(pack.price_mxn)}</div>
                  <Button
                    className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"
                    disabled={pendingId === pack.id}
                    onClick={() => handleBuy(pack.id)}
                  >
                    {pendingId === pack.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo…
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Comprar
                      </>
                    )}
                  </Button>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
