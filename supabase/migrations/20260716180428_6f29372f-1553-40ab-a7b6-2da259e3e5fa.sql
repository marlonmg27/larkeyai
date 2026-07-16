
-- Reemplazar activate_client por la nueva firma (uuid, uuid, text)
DROP FUNCTION IF EXISTS public.activate_client(uuid, text);

CREATE OR REPLACE FUNCTION public.activate_client(
  p_user_id uuid,
  p_plan_id uuid,
  p_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_included integer;
BEGIN
  -- Validar plan
  SELECT messages_included INTO v_included
  FROM public.plans WHERE id = p_plan_id;

  IF v_included IS NULL THEN
    RAISE EXCEPTION 'Plan % no existe', p_plan_id;
  END IF;

  -- Validar profile
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario % no existe', p_user_id;
  END IF;

  -- Fallar si ya tiene balance (cliente ya activado)
  IF EXISTS (SELECT 1 FROM public.usage_balance WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'El usuario % ya está activado (usage_balance existente)', p_user_id;
  END IF;

  -- Asignar plan y teléfono
  UPDATE public.profiles
  SET plan_id = p_plan_id,
      phone = p_phone
  WHERE id = p_user_id;

  -- Crear balance inicial
  INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
  VALUES (p_user_id, v_included, 0, now(), now() + interval '1 month');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_client(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_client(uuid, uuid, text) TO service_role;
