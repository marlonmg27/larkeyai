
-- 1. profiles.plan_id: nullable, sin default
ALTER TABLE public.profiles ALTER COLUMN plan_id DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN plan_id DROP NOT NULL;

-- 2. handle_new_user: solo crea profile como lead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- 3. activate_client: activación manual (solo service_role)
CREATE OR REPLACE FUNCTION public.activate_client(p_user_id uuid, p_plan_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_included integer;
BEGIN
  SELECT id, messages_included INTO v_plan_id, v_included
  FROM public.plans WHERE name = p_plan_name;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan % no existe', p_plan_name;
  END IF;

  UPDATE public.profiles SET plan_id = v_plan_id WHERE id = p_user_id;

  INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
  VALUES (p_user_id, v_included, 0, now(), now() + interval '1 month')
  ON CONFLICT (user_id) DO UPDATE
    SET messages_remaining = v_included,
        messages_used_period = 0,
        period_start = now(),
        period_end = now() + interval '1 month';
END;
$$;

-- usage_balance necesita PK/unique en user_id para ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.usage_balance'::regclass
      AND contype IN ('p','u')
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.usage_balance'::regclass AND attname='user_id')]
  ) THEN
    ALTER TABLE public.usage_balance ADD CONSTRAINT usage_balance_user_id_key UNIQUE (user_id);
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.activate_client(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_client(uuid, text) TO service_role;

-- 4. reset_expired_usage_balances: excluir leads explícitamente
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
  WHERE ub.user_id = pr.id
    AND pr.plan_id IS NOT NULL
    AND ub.period_end <= now();
END;
$$;
