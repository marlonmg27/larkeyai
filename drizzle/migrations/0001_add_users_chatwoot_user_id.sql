ALTER TABLE public.users ADD COLUMN IF NOT EXISTS chatwoot_user_id bigint;

UPDATE public.users
SET chatwoot_user_id = chatwoot_id
WHERE chatwoot_user_id IS NULL AND chatwoot_id IS NOT NULL;