CREATE OR REPLACE FUNCTION public.prevent_protected_user_columns_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
BEGIN
  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.id       IS DISTINCT FROM OLD.id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.phone IS DISTINCT FROM OLD.phone
     OR NEW.plan_id IS DISTINCT FROM OLD.plan_id THEN
    RAISE EXCEPTION 'Action not allowed';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER users_prevent_protected_columns_update
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_protected_user_columns_update();