
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  messages_included integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable"
  ON public.plans FOR SELECT
  USING (true);

-- TODO: edit placeholder messages_included and price values
INSERT INTO public.plans (name, messages_included, price) VALUES
  ('basic', 100, 0),         -- TODO: edit
  ('pro', 1000, 0),          -- TODO: edit
  ('enterprise', 5000, 0);   -- TODO: edit
