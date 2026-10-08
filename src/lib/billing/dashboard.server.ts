/**
 * Dashboard billing reads via service role when backend auth is on.
 * Scoped to the JWT caller (user_id = sub; tenant_id must be present on the token).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type DashboardBillingData = {
  plan: { name: string; price: number; messagesIncluded: number; interval: string } | null;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  };
  balance: { messagesRemaining: number; messagesUsed: number; periodEnd: string } | null;
  purchases: Array<{
    id: string;
    created_at: string;
    package: string;
    messages_purchased: number;
    amount: number;
  }>;
  whatsapp: { status: string } | null;
  chatwoot: { userId: number | null; accountId: number | null };
};

export async function fetchDashboardBilling(
  supabaseAdmin: SupabaseClient<Database>,
  opts: { userId: string; tenantId: string },
): Promise<DashboardBillingData> {
  if (!opts.tenantId) {
    throw new Error("Missing tenant_id on access token");
  }

  // Lovable billing tables are still keyed by user_id. The JWT tenant_id gates the
  // caller; Stripe metadata carries tenant_id for the Postgres apply path.
  const [profileRes, balanceRes, purchasesRes, whatsappRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select(
        "plan_id, subscription_status, cancel_at_period_end, trial_ends_at, current_period_end, chatwoot_user_id, chatwoot_account_id, plans:plan_id(name, price, messages_included, billing_interval)",
      )
      .eq("id", opts.userId)
      .maybeSingle(),
    supabaseAdmin
      .from("usage_balance")
      .select("messages_remaining, messages_used_period, period_end")
      .eq("user_id", opts.userId)
      .maybeSingle(),
    supabaseAdmin
      .from("purchases")
      .select("id, created_at, package, messages_purchased, amount")
      .eq("user_id", opts.userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("whatsapp_connections")
      .select("status")
      .eq("user_id", opts.userId)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (balanceRes.error) throw balanceRes.error;
  if (purchasesRes.error) throw purchasesRes.error;
  if (whatsappRes.error) {
    console.error("[dashboard-billing] whatsapp_connections read failed", {
      tenant_id: opts.tenantId,
      code: whatsappRes.error.code,
    });
  }

  const planRow = (profileRes.data?.plans ?? null) as
    | { name: string; price: number; messages_included: number; billing_interval: string }
    | null;

  return {
    plan: planRow
      ? {
          name: planRow.name,
          price: Number(planRow.price),
          messagesIncluded: planRow.messages_included,
          interval: planRow.billing_interval,
        }
      : null,
    subscription: {
      status: profileRes.data?.subscription_status ?? "none",
      cancelAtPeriodEnd: profileRes.data?.cancel_at_period_end ?? false,
      trialEndsAt: profileRes.data?.trial_ends_at ?? null,
      currentPeriodEnd: profileRes.data?.current_period_end ?? null,
    },
    balance: balanceRes.data
      ? {
          messagesRemaining: balanceRes.data.messages_remaining,
          messagesUsed: balanceRes.data.messages_used_period,
          periodEnd: balanceRes.data.period_end,
        }
      : null,
    purchases: purchasesRes.data ?? [],
    whatsapp: whatsappRes.data ? { status: whatsappRes.data.status } : null,
    chatwoot: {
      userId: profileRes.data?.chatwoot_user_id ?? null,
      accountId: profileRes.data?.chatwoot_account_id ?? null,
    },
  };
}
