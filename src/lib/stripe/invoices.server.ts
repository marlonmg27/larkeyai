/**
 * Invoice history reads (server-only).
 *
 * FastAPI mapping:
 *   GET /internal/invoices?user_id=...  ->  { invoices: [...] }
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getStripe } from "./client.server";
import type { InvoiceSummary, ListInvoicesResponse } from "./contracts";

export async function listInvoices(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
): Promise<ListInvoicesResponse> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (!user?.stripe_customer_id) return { invoices: [] };

  const list = await getStripe().invoices.list({ customer: user.stripe_customer_id, limit: 20 });
  const invoices: InvoiceSummary[] = list.data.map((inv) => ({
    id: inv.id!,
    amount: (inv.amount_paid ?? 0) / 100,
    status: inv.status,
    created: inv.created,
    hosted_invoice_url: inv.hosted_invoice_url ?? null,
  }));
  return { invoices };
}
