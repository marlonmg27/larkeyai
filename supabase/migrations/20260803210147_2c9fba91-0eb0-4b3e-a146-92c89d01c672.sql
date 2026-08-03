ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS lookup_key text;
ALTER TABLE public.message_packs ADD COLUMN IF NOT EXISTS lookup_key text;

CREATE UNIQUE INDEX IF NOT EXISTS plans_lookup_key_key ON public.plans (lookup_key) WHERE lookup_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS plans_stripe_price_id_key ON public.plans (stripe_price_id) WHERE stripe_price_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS message_packs_lookup_key_key ON public.message_packs (lookup_key) WHERE lookup_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS message_packs_stripe_price_id_key ON public.message_packs (stripe_price_id) WHERE stripe_price_id IS NOT NULL;

UPDATE public.plans p SET stripe_price_id = v.price_id, lookup_key = v.lookup_key
FROM (VALUES
  ('basic','month','price_1TvkFqHYaQczOYXkeGrsazvY','basic_plan'),
  ('basic','year','price_1U0SFXHYaQczOYXkHR9swQgU','basic_annually'),
  ('standard','month','price_1U0SHmHYaQczOYXk9APrBIKY','standard_plan'),
  ('standard','year','price_1U0SJoHYaQczOYXkr9y25qEM','standard_annually'),
  ('pro','month','price_1U0SKkHYaQczOYXk1vcmMDlk','pro_plan'),
  ('pro','year','price_1U0SLkHYaQczOYXktqhp3tFh','pro_annually')
) AS v(tier, billing_interval, price_id, lookup_key)
WHERE p.tier = v.tier AND p.billing_interval = v.billing_interval;

UPDATE public.message_packs m SET stripe_price_id = v.price_id, lookup_key = v.lookup_key
FROM (VALUES
  ('small','price_1U0SWAHYaQczOYXkz3JR2Gd2','messages_small'),
  ('medium','price_1U0SX3HYaQczOYXkn6RIAyhK','messages_medium'),
  ('large','price_1U0SY0HYaQczOYXkcGFZ76aP','messages_large')
) AS v(code, price_id, lookup_key)
WHERE m.code = v.code;