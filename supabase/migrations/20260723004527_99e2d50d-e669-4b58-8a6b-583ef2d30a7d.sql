
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_name_key;

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month','year')),
  ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('basic','standard','pro')),
  ADD COLUMN IF NOT EXISTS stripe_price_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_days int NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS trial_message_cap int NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS trial_requires_payment_method boolean NOT NULL DEFAULT false;

DELETE FROM public.plans;

-- Future-planned Basic pricing (not applied): 6,000 msgs @ 1,900 MXN. See src/lib/stripe/README.md.
INSERT INTO public.plans (name, tier, billing_interval, price, messages_included) VALUES
  ('Basic',    'basic',    'month', 2000,  7000),
  ('Basic',    'basic',    'year',  19200, 7000),
  ('Standard', 'standard', 'month', 3200, 12000),
  ('Standard', 'standard', 'year',  30720,12000),
  ('Pro',      'pro',      'month', 5000, 20000),
  ('Pro',      'pro',      'year',  48000,20000);

CREATE UNIQUE INDEX IF NOT EXISTS plans_tier_interval_active_uidx
  ON public.plans (tier, billing_interval) WHERE active;

CREATE TABLE IF NOT EXISTS public.message_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  messages int NOT NULL,
  price_mxn numeric NOT NULL,
  stripe_price_id text UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.message_packs TO anon, authenticated;
GRANT ALL ON public.message_packs TO service_role;
ALTER TABLE public.message_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Message packs are publicly readable" ON public.message_packs;
CREATE POLICY "Message packs are publicly readable"
  ON public.message_packs FOR SELECT USING (active = true);

INSERT INTO public.message_packs (code, name, messages, price_mxn) VALUES
  ('small',  'Small Pack',   5000, 1600),
  ('medium', 'Medium Pack', 15000, 4200),
  ('large',  'Large Pack',  40000, 10000)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none','trialing','active','past_due','canceled')),
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS pack_id uuid REFERENCES public.message_packs(id),
  ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.usage_balance'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.usage_balance ADD PRIMARY KEY (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.can_buy_pack(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT subscription_status IN ('active','trialing') FROM public.users WHERE id = p_user_id),
    false
  );
$$;
REVOKE ALL ON FUNCTION public.can_buy_pack(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_buy_pack(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.apply_subscription_event(
  p_user_id uuid,
  p_action text,
  p_plan_id uuid DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL,
  p_subscription_id text DEFAULT NULL,
  p_trial_ends_at timestamptz DEFAULT NULL,
  p_current_period_end timestamptz DEFAULT NULL,
  p_cancel_at_period_end boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_messages_included int;
  v_trial_cap int;
BEGIN
  IF p_plan_id IS NOT NULL THEN
    SELECT messages_included, trial_message_cap INTO v_messages_included, v_trial_cap
      FROM public.plans WHERE id = p_plan_id;
    IF v_messages_included IS NULL THEN
      RAISE EXCEPTION 'Plan % not found', p_plan_id;
    END IF;
  END IF;

  UPDATE public.users SET
    plan_id              = COALESCE(p_plan_id, plan_id),
    stripe_customer_id   = COALESCE(p_stripe_customer_id, stripe_customer_id),
    subscription_id      = COALESCE(p_subscription_id, subscription_id),
    trial_ends_at        = COALESCE(p_trial_ends_at, trial_ends_at),
    current_period_end   = COALESCE(p_current_period_end, current_period_end),
    cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end),
    subscription_status  = CASE p_action
      WHEN 'trial_started' THEN 'trialing'
      WHEN 'activated'     THEN 'active'
      WHEN 'renewed'       THEN 'active'
      WHEN 'past_due'      THEN 'past_due'
      WHEN 'canceled'      THEN 'canceled'
      ELSE subscription_status
    END
  WHERE id = p_user_id;

  IF p_action = 'trial_started' THEN
    INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
    VALUES (p_user_id, COALESCE(v_trial_cap, 500), 0, now(), COALESCE(p_trial_ends_at, now() + interval '14 days'))
    ON CONFLICT (user_id) DO NOTHING;

  ELSIF p_action IN ('activated','renewed') THEN
    INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
    VALUES (p_user_id, v_messages_included, 0, now(), COALESCE(p_current_period_end, now() + interval '1 month'))
    ON CONFLICT (user_id) DO UPDATE SET
      messages_remaining   = v_messages_included,
      messages_used_period = 0,
      period_start         = now(),
      period_end           = COALESCE(p_current_period_end, now() + interval '1 month');

  ELSIF p_action = 'canceled' THEN
    UPDATE public.usage_balance ub
       SET messages_remaining = 0, period_end = now()
      FROM public.users u
     WHERE ub.user_id = p_user_id AND u.id = p_user_id
       AND (u.trial_ends_at IS NOT NULL AND u.trial_ends_at <= now() AND u.current_period_end IS NULL);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_subscription_event(uuid, text, uuid, text, text, timestamptz, timestamptz, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(uuid, text, uuid, text, text, timestamptz, timestamptz, boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_protected_user_columns_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
BEGIN
  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.id                    IS DISTINCT FROM OLD.id
     OR NEW.email              IS DISTINCT FROM OLD.email
     OR NEW.phone              IS DISTINCT FROM OLD.phone
     OR NEW.plan_id            IS DISTINCT FROM OLD.plan_id
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.subscription_id    IS DISTINCT FROM OLD.subscription_id
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_ends_at      IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
     OR NEW.cancel_at_period_end IS DISTINCT FROM OLD.cancel_at_period_end THEN
    RAISE EXCEPTION 'Action not allowed';
  END IF;
  RETURN NEW;
END;
$$;
