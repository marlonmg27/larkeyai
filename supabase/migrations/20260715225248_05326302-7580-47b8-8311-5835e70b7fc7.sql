
REVOKE ALL ON FUNCTION public.decrement_messages(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_purchased_messages(uuid, int, text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_send_message(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_expired_usage_balances() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.decrement_messages(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_purchased_messages(uuid, int, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_expired_usage_balances() TO service_role;
