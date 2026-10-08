/**
 * Billing server functions. Checkout metadata is set by the backend.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";

const planIdInput = z.object({ planId: z.string().uuid() });
const packIdInput = z.object({ packId: z.string().uuid() });

const BILLING_TIMEOUT_MS = 20_000;

export type CatalogPlan = {
  id: string;
  name: string;
  tier: string | null;
  price: number;
  messages_included: number;
  billing_interval: string;
};

export type CatalogPack = {
  id: string;
  code: string;
  name: string;
  messages: number;
  price_mxn: number;
};

export type BillingCatalog = {
  plans: CatalogPlan[];
  packs: CatalogPack[];
};

const PUBLISHED_PLANS: CatalogPlan[] = [
  { id: "published-basic-month", name: "Basic", tier: "basic", price: 2000, messages_included: 7000, billing_interval: "month" },
  { id: "published-basic-year", name: "Basic", tier: "basic", price: 19200, messages_included: 7000, billing_interval: "year" },
  { id: "published-standard-month", name: "Standard", tier: "standard", price: 3200, messages_included: 12000, billing_interval: "month" },
  { id: "published-standard-year", name: "Standard", tier: "standard", price: 30720, messages_included: 12000, billing_interval: "year" },
  { id: "published-pro-month", name: "Pro", tier: "pro", price: 5000, messages_included: 20000, billing_interval: "month" },
  { id: "published-pro-year", name: "Pro", tier: "pro", price: 48000, messages_included: 20000, billing_interval: "year" },
];

export const getBillingCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<BillingCatalog> => {
  const { readRequestAccessToken } = await import("@/lib/auth/session-cookie.server");
  const token = readRequestAccessToken();
  if (!token) return { plans: PUBLISHED_PLANS, packs: [] };

  const { verifyAccessToken } = await import("@/lib/auth/jwt.server");
  await verifyAccessToken(token);
  const { callBackend } = await import("@/lib/backend/http.server");
  const body = (await callBackend("/billing/plans", {
    method: "GET",
    token,
    timeoutMs: BILLING_TIMEOUT_MS,
  })) as { plans?: unknown; packs?: unknown };
  return {
    plans: asArray(body.plans).map(mapPlan).filter((plan): plan is CatalogPlan => plan != null),
    packs: asArray(body.packs).map(mapPack).filter((pack): pack is CatalogPack => pack != null),
  };
});

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .inputValidator((data: unknown) => planIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const result = await postBilling(context.accessToken, "/billing/checkout", {
      kind: "subscription",
      plan_id: data.planId,
    });
    return { url: checkoutUrl(result) };
  });

export const createPackCheckout = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .inputValidator((data: unknown) => packIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const result = await postBilling(context.accessToken, "/billing/checkout", {
      kind: "pack",
      pack_id: data.packId,
    });
    return { url: checkoutUrl(result) };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    await postBilling(context.accessToken, "/billing/cancel");
    return { ok: true as const };
  });

export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    await postBilling(context.accessToken, "/billing/resume");
    return { ok: true as const };
  });

export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireBackendAuth])
  .inputValidator((data: unknown) => planIdInput.parse(data))
  .handler(async ({ data, context }) => {
    await postBilling(context.accessToken, "/billing/change-plan", { plan_id: data.planId });
    return { ok: true as const };
  });

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    const { callBackend } = await import("@/lib/backend/http.server");
    const body = (await callBackend("/billing/invoices", {
      method: "GET",
      token: context.accessToken,
      timeoutMs: BILLING_TIMEOUT_MS,
    })) as { invoices?: unknown };
    const invoices = asArray(body.invoices).map((row) => {
      const item = asRecord(row);
      const amountDue = Number(item["amount_due"] ?? 0);
      return {
        id: String(item["id"] ?? ""),
        amount: Number.isFinite(amountDue) ? amountDue / 100 : 0,
        status: typeof item["status"] === "string" ? item["status"] : null,
        created: Number(item["created"] ?? 0),
        hosted_invoice_url: typeof item["hosted_invoice_url"] === "string" ? item["hosted_invoice_url"] : null,
      };
    });
    return { invoices };
  });

async function postBilling(token: string, path: string, body?: unknown): Promise<unknown> {
  const { callBackend, BackendHttpError } = await import("@/lib/backend/http.server");
  try {
    return await callBackend(path, { method: "POST", token, body, timeoutMs: BILLING_TIMEOUT_MS });
  } catch (err) {
    if (err instanceof BackendHttpError && err.status === 409) {
      throw new Error(spanishBillingConflict(err.message));
    }
    if (err instanceof BackendHttpError) {
      throw new Error("No pudimos completar la operación de facturación.");
    }
    throw err;
  }
}

function spanishBillingConflict(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("active subscription") || lower.includes("change plan")) {
    return "Ya tienes una suscripción activa. Cambia de plan en lugar de crear otra.";
  }
  if (lower.includes("message pack") || lower.includes("active subscription to buy")) {
    return "Necesitas una suscripción activa para comprar paquetes de mensajes.";
  }
  if (!message.includes("{") && message.length < 280) return message;
  return "No pudimos completar la operación de facturación.";
}

function checkoutUrl(result: unknown): string {
  const url = asRecord(result)["url"];
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("No pudimos iniciar el checkout.");
  }
  return url;
}

function mapPlan(row: unknown): CatalogPlan | null {
  const item = asRecord(row);
  const id = stringField(item, "id");
  const name = stringField(item, "name");
  const interval = stringField(item, "billing_interval");
  if (!id || !name || !interval) return null;
  const tierSource = `${stringField(item, "tier") ?? ""} ${name}`.toLowerCase();
  const tier = tierSource.includes("standard")
    ? "standard"
    : tierSource.includes("basic")
      ? "basic"
      : tierSource.includes("pro")
        ? "pro"
        : null;
  return {
    id,
    name,
    tier,
    price: numberField(item, "price"),
    messages_included: numberField(item, "messages_included"),
    billing_interval: interval,
  };
}

function mapPack(row: unknown): CatalogPack | null {
  const item = asRecord(row);
  const id = stringField(item, "id");
  const name = stringField(item, "name");
  if (!id || !name) return null;
  return {
    id,
    code: stringField(item, "code") ?? "",
    name,
    messages: numberField(item, "messages"),
    price_mxn: numberField(item, "price_mxn"),
  };
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringField(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberField(row: Record<string, unknown>, key: string): number {
  const value = Number(row[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}
