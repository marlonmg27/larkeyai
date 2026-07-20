
ALTER TABLE public.profiles RENAME TO users;

-- Rename policies
ALTER POLICY "Users can view their own profile" ON public.users RENAME TO "Users can view their own record";
ALTER POLICY "Users can update their own profile" ON public.users RENAME TO "Users can update their own record";

-- Re-apply grants explicitly
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Update function bodies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_client(p_user_id uuid, p_plan_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_included integer;
BEGIN
  SELECT messages_included INTO v_included
  FROM public.plans WHERE id = p_plan_id;

  IF v_included IS NULL THEN
    RAISE EXCEPTION 'Plan % no existe', p_plan_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario % no existe', p_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.usage_balance WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'El usuario % ya está activado (usage_balance existente)', p_user_id;
  END IF;

  UPDATE public.users
  SET plan_id = p_plan_id,
      phone = p_phone
  WHERE id = p_user_id;

  INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
  VALUES (p_user_id, v_included, 0, now(), now() + interval '1 month');
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_expired_usage_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.usage_balance ub
  SET messages_remaining = p.messages_included,
      messages_used_period = 0,
      period_start = now(),
      period_end = now() + interval '1 month'
  FROM public.users pr
  JOIN public.plans p ON p.id = pr.plan_id
  WHERE ub.user_id = pr.id
    AND pr.plan_id IS NOT NULL
    AND ub.period_end <= now();
END;
$function$;
