ALTER TABLE public.stripe_events
  ADD COLUMN IF NOT EXISTS forwarded_to_backend boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forward_error text;