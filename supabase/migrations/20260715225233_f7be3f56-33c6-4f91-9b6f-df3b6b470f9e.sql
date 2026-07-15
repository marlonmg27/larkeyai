
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.reset_expired_usage_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_balance ub
  SET messages_remaining = p.messages_included,
      messages_used_period = 0,
      period_start = now(),
      period_end = now() + interval '1 month'
  FROM public.profiles pr
  JOIN public.plans p ON p.id = pr.plan_id
  WHERE ub.user_id = pr.id AND ub.period_end <= now();
END;
$$;

REVOKE ALL ON FUNCTION public.reset_expired_usage_balances() FROM public;

SELECT cron.schedule(
  'reset-expired-usage-balances',
  '0 3 * * *',
  $$ SELECT public.reset_expired_usage_balances(); $$
);
