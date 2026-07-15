
-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  plan text NOT NULL DEFAULT 'basic',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- usage_balance
CREATE TABLE public.usage_balance (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages_remaining integer NOT NULL DEFAULT 0,
  messages_used_period integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_balance TO authenticated;
GRANT ALL ON public.usage_balance TO service_role;
ALTER TABLE public.usage_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage balance" ON public.usage_balance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- purchases
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package text NOT NULL,
  messages_purchased integer NOT NULL,
  amount numeric(10,2) NOT NULL,
  stripe_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX purchases_user_id_created_at_idx ON public.purchases (user_id, created_at DESC);

-- new-user trigger: create profile + usage_balance on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'basic'
  );
  INSERT INTO public.usage_balance (user_id, messages_remaining, messages_used_period, period_start, period_end)
  VALUES (NEW.id, 100, 0, now(), now() + interval '30 days');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
