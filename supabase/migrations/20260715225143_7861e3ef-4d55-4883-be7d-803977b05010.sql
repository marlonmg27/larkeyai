
ALTER TABLE public.profiles ADD COLUMN plan_id uuid REFERENCES public.plans(id);

UPDATE public.profiles p
SET plan_id = pl.id
FROM public.plans pl
WHERE pl.name = p.plan;

UPDATE public.profiles
SET plan_id = (SELECT id FROM public.plans WHERE name = 'basic')
WHERE plan_id IS NULL;

ALTER TABLE public.profiles ALTER COLUMN plan_id SET NOT NULL;

DO $$
DECLARE
  basic_id uuid;
BEGIN
  SELECT id INTO basic_id FROM public.plans WHERE name = 'basic';
  EXECUTE format('ALTER TABLE public.profiles ALTER COLUMN plan_id SET DEFAULT %L', basic_id);
END $$;

ALTER TABLE public.profiles DROP COLUMN plan;
