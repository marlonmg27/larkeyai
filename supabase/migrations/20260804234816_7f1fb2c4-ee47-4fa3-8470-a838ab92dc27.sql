CREATE TYPE public.whatsapp_connection_status AS ENUM ('not_connected', 'pending', 'connected', 'error');

CREATE TABLE public.whatsapp_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status public.whatsapp_connection_status NOT NULL DEFAULT 'not_connected',
  phone_display text,
  chatwoot_inbox_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whatsapp_connections TO authenticated;
GRANT ALL ON public.whatsapp_connections TO service_role;

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp connection"
ON public.whatsapp_connections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_whatsapp_connections_updated_at
BEFORE UPDATE ON public.whatsapp_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();