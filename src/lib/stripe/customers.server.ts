/**
 * Stripe Customer lifecycle (server-only).
 *
 * FastAPI mapping:
 *   POST /internal/customers/ensure { user_id }  ->  { stripe_customer_id }
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getStripe } from "./client.server";

export async function getOrCreateCustomer(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  opts?: { tenantId?: string; email?: string | null },
): Promise<string> {
  const tenantId = opts?.tenantId;
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, phone, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  if (user?.stripe_customer_id) return user.stripe_customer_id;

  if (!user && !tenantId) {
    throw new Error("User not found");
  }

  const stripe = getStripe();
  const metadata: Record<string, string> = { user_id: userId };
  if (tenantId) metadata["tenant_id"] = tenantId;

  const customer = await stripe.customers.create({
    email: user?.email ?? opts?.email ?? undefined,
    phone: user?.phone ?? undefined,
    metadata,
  });

  if (user) {
    const { error: upErr } = await supabaseAdmin
      .from("users")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);
    if (upErr) throw upErr;
  }

  return customer.id;
}
