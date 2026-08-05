import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
// Misma instancia autenticada (singleton) que usan las queries del dashboard:
// el socket de Realtime va con la sesión del usuario, así RLS filtra los eventos a su fila.
import { supabase } from "@/integrations/supabase/client";

/**
 * Suscribe el dashboard a cambios en la fila de whatsapp_connections del usuario.
 * Al recibir un evento invalida ["dashboard", userId] para refrescar el estado.
 */
export function useWhatsappConnectionRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`whatsapp-connection-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_connections",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
