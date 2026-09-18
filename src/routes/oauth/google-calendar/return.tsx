import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/google-calendar/return")({
  ssr: false,
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("Terminando la conexión…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "google_calendar", code: code ?? null },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "La conexión no se completó.");
      notify("appUserConnectorOAuthFailed");
      return;
    }

    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("La conexión terminó sin código de intercambio.");
      notify("appUserConnectorOAuthFailed");
      return;
    }

    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
