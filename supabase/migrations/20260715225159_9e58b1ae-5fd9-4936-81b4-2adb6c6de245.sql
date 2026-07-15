
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  basic_plan_id uuid;
  basic_messages integer;
BEGIN
  SELECT id, messages_included INTO basic_plan_id, basic_messages
  FROM public.plans WHERE name = 'basic';

  INSERT INTO public.profiles (id, email, phone, plan_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    basic_plan_id
  );

  INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
  VALUES (NEW.id, basic_messages, 0, now(), now() + interval '1 month');

  RETURN NEW;
END;
$$;
