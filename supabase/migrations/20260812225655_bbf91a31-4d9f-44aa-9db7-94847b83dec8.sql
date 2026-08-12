SET LOCAL request.jwt.claims = '{"role":"service_role"}';

UPDATE public.users
   SET plan_id = '4403885c-b340-4872-b274-1869fd5bd762',
       subscription_status = 'trialing',
       trial_ends_at = now() + interval '14 days',
       current_period_end = now() + interval '14 days',
       cancel_at_period_end = false
 WHERE id = '839f8872-dbcd-43c1-87d0-f92a86c61d71';

INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
VALUES ('839f8872-dbcd-43c1-87d0-f92a86c61d71', 500, 0, now(), now() + interval '14 days')
ON CONFLICT (user_id) DO UPDATE
  SET messages_remaining = 500,
      messages_used_period = 0,
      period_start = now(),
      period_end = now() + interval '14 days';