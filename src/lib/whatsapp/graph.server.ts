/**
 * Verificación con la Graph API de Meta (WhatsApp Cloud API).
 *
 * Comprueba que el Phone number ID pertenezca a la WhatsApp Business Account
 * indicada y que su display_phone_number coincida con el número capturado.
 *
 * Nunca se registra el token en logs.
 */

const GRAPH_VERSION = "v25.0";
const TIMEOUT_MS = 10_000;

export type VerifyPhoneInput = {
  wabaId: string;
  phoneNumberId: string;
  /** E.164, p. ej. +526621234567 */
  phoneNumber: string;
};

export type VerifyPhoneResult =
  | { ok: true; displayPhoneNumber: string; verifiedName: string | null }
  | {
      ok: false;
      reason: "phone_number_id_not_found" | "phone_mismatch" | "unavailable";
      field: "phoneNumberId" | "phoneNumber" | null;
      message: string;
      expected?: string;
    };

type GraphPhoneNumber = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
};

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

async function graphGet(
  path: string,
  token: string,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const raw = await res.text().catch(() => "");
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

export async function verifyPhoneBelongsToWaba(
  input: VerifyPhoneInput,
): Promise<VerifyPhoneResult> {
  const token = process.env["WABA_ACCESS_TOKEN"];
  if (!token) {
    console.error("[whatsapp-graph] WABA_ACCESS_TOKEN sin configurar");
    return {
      ok: false,
      reason: "unavailable",
      field: null,
      message:
        "No pudimos validar el número con WhatsApp en este momento. Inténtalo de nuevo.",
    };
  }

  const unavailable: VerifyPhoneResult = {
    ok: false,
    reason: "unavailable",
    field: null,
    message:
      "No pudimos validar el número con WhatsApp en este momento. Inténtalo de nuevo.",
  };

  let match: GraphPhoneNumber | null = null;

  try {
    const listed = await graphGet(
      `${encodeURIComponent(input.wabaId)}/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status`,
      token,
    );

    if (listed.status === 200) {
      const data = (listed.body as { data?: GraphPhoneNumber[] } | null)?.data;
      const items = Array.isArray(data) ? data : [];
      match = items.find((p) => p.id === input.phoneNumberId) ?? null;

      if (!match) {
        console.warn("[whatsapp-graph] phone_number_id fuera de la cuenta", {
          reason: "phone_number_id_not_found",
        });
        return {
          ok: false,
          reason: "phone_number_id_not_found",
          field: "phoneNumberId",
          message:
            "Ese Phone number ID no existe en la WhatsApp Business Account indicada.",
        };
      }
    } else if (listed.status === 400 || listed.status === 403) {
      // Sin permisos para listar la cuenta: validamos al menos el número del ID.
      const single = await graphGet(
        `${encodeURIComponent(input.phoneNumberId)}?fields=display_phone_number,verified_name`,
        token,
      );
      if (single.status === 404 || single.status === 400) {
        return {
          ok: false,
          reason: "phone_number_id_not_found",
          field: "phoneNumberId",
          message:
            "Ese Phone number ID no existe en la WhatsApp Business Account indicada.",
        };
      }
      if (single.status !== 200) {
        console.error("[whatsapp-graph] respuesta no-2xx", { status: single.status });
        return unavailable;
      }
      match = (single.body ?? null) as GraphPhoneNumber | null;
    } else {
      console.error("[whatsapp-graph] respuesta no-2xx", { status: listed.status });
      return unavailable;
    }
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    console.error("[whatsapp-graph] fetch falló", { reason: name });
    return unavailable;
  }

  const display = match?.display_phone_number ?? "";
  if (!display) return unavailable;

  if (digits(display) !== digits(input.phoneNumber)) {
    console.warn("[whatsapp-graph] número no coincide", { reason: "phone_mismatch" });
    return {
      ok: false,
      reason: "phone_mismatch",
      field: "phoneNumber",
      message: `El número no coincide con el registrado en la WhatsApp Business Account (${display}).`,
      expected: display,
    };
  }

  return {
    ok: true,
    displayPhoneNumber: display,
    verifiedName: match?.verified_name ?? null,
  };
}
