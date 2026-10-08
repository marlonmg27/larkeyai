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
): Promise<string> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, phone, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw new Error("User not found");

  if (user.stripe_customer_id) return user.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    metadata: { user_id: userId },
  });

  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  if (upErr) throw upErr;

  return customer.id;
}
