
CREATE OR REPLACE FUNCTION public.decrement_messages(p_user_id uuid, p_count int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_balance
  SET messages_remaining = messages_remaining - p_count,
      messages_used_period = messages_used_period + p_count
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT messages_remaining > 0 FROM public.usage_balance WHERE user_id = p_user_id), false);
$$;

CREATE OR REPLACE FUNCTION public.add_purchased_messages(
  p_user_id uuid,
  p_messages int,
  p_package text,
  p_amount numeric,
  p_stripe_payment_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_balance
  SET messages_remaining = messages_remaining + p_messages
  WHERE user_id = p_user_id;

  INSERT INTO public.purchases (user_id, package, messages_purchased, amount, stripe_payment_id)
  VALUES (p_user_id, p_package, p_messages, p_amount, p_stripe_payment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_messages(uuid, int) FROM public;
REVOKE ALL ON FUNCTION public.add_purchased_messages(uuid, int, text, numeric, text) FROM public;
REVOKE ALL ON FUNCTION public.can_send_message(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.decrement_messages(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_purchased_messages(uuid, int, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid) TO service_role, authenticated;
