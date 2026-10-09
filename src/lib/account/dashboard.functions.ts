/**
 * Dashboard read model from GET /account.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireBackendAuth } from "@/lib/auth/backend-middleware";

const TIMEOUT_MS = 15_000;

export type DashboardAccount = {
  plan: { name: string; price: number; messagesIncluded: number; interval: string } | null;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  };
  balance: {
    messagesRemaining: number;
    additionalMessagesRemaining: number;
    messagesUsed: number;
    periodEnd: string;
  } | null;
  purchases: Array<{
    id: string;
    created_at: string;
    package: string;
    messages_purchased: number;
    amount: number;
  }>;
  whatsapp: { status: string } | null;
  chatwootProvisioned: boolean;
};

export const getDashboardAccount = createServerFn({ method: "GET" })
  .middleware([requireBackendAuth])
  .handler(async ({ context }) => {
    const { callBackend } = await import("@/lib/backend/http.server");
    const body = await callBackend("/account", {
      method: "GET",
      token: context.accessToken,
      timeoutMs: TIMEOUT_MS,
    });
    return mapAccount(body);
  });

function mapAccount(body: unknown): DashboardAccount {
  const row = asRecord(body);
  const plan = asRecord(row["plan"]);
  const balance = asRecord(row["balance"]);
  const planName = stringOrNull(plan["name"]);
  const connections = Array.isArray(row["connections"]) ? row["connections"] : [];
  const firstConnection = asRecord(connections[0]);
  const whatsappStatus = stringOrNull(firstConnection["status"]);

  return {
    plan: planName
      ? {
          name: planName,
          price: numberOrZero(plan["price"]),
          messagesIncluded: numberOrZero(plan["messages_included"]),
          interval: stringOrNull(plan["billing_interval"]) ?? "month",
        }
      : null,
    subscription: {
      status: stringOrNull(row["subscription_status"]) ?? "none",
      cancelAtPeriodEnd: row["cancel_at_period_end"] === true,
      trialEndsAt: stringOrNull(row["trial_ends_at"]),
      currentPeriodEnd: stringOrNull(row["current_period_end"]),
    },
    balance:
      row["balance"] && typeof row["balance"] === "object"
        ? {
            messagesRemaining: numberOrZero(balance["messages_remaining"]),
            additionalMessagesRemaining: numberOrZero(balance["additional_messages_remaining"]),
            messagesUsed: numberOrZero(balance["messages_used_period"]),
            periodEnd: stringOrNull(balance["period_end"]) ?? "",
          }
        : null,
    purchases: (Array.isArray(row["purchases"]) ? row["purchases"] : []).map((item) => {
      const purchase = asRecord(item);
      return {
        id: stringOrNull(purchase["id"]) ?? "",
        created_at: stringOrNull(purchase["created_at"]) ?? "",
        package: stringOrNull(purchase["package"]) ?? "",
        messages_purchased: numberOrZero(purchase["messages_purchased"]),
        amount: numberOrZero(purchase["amount"]),
      };
    }),
    whatsapp: whatsappStatus ? { status: whatsappStatus } : null,
    chatwootProvisioned: row["chatwoot_provisioned"] === true,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOrZero(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
