import { useEffect, useState } from "react";
import { facebookAppId, graphApiVersion } from "@/lib/whatsapp/embedded-signup";

export type FBLoginResponse = {
  authResponse?: { code?: string; accessToken?: string } | null;
  status?: string;
};

type FBLoginOptions = {
  config_id: string;
  response_type: string;
  override_default_response_type: boolean;
  extras: Record<string, unknown>;
};

export type FacebookSDK = {
  init: (options: {
    appId: string;
    version: string;
    xfbml?: boolean;
    cookie?: boolean;
    autoLogAppEvents?: boolean;
  }) => void;
  login: (callback: (response: FBLoginResponse) => void, options: FBLoginOptions) => void;
};

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";
const SCRIPT_ID = "facebook-jssdk";

/**
 * Carga condicional e idempotente del SDK de Facebook.
 * Solo se inyecta cuando `enabled` es true (canal WhatsApp seleccionado y el flag
 * de Embedded Signup activo), y solo en el navegador.
 */
export function useFacebookSdk(enabled: boolean) {
  const [ready, setReady] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(window.FB),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.FB) {
      setReady(true);
      return;
    }

    const initSdk = () => {
      window.FB?.init({
        appId: facebookAppId,
        version: graphApiVersion,
        xfbml: false,
        cookie: true,
        autoLogAppEvents: true,
      });
      setReady(true);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      window.fbAsyncInit = initSdk;
      return;
    }

    window.fbAsyncInit = initSdk;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => setError("No pudimos cargar el conector de Meta.");
    document.body.appendChild(script);
  }, [enabled]);

  return { ready, error };
}
