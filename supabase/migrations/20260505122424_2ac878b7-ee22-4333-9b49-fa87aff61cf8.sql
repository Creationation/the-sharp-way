REVOKE EXECUTE ON FUNCTION public.admin_adjust_loyalty(uuid, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.admin_adjust_loyalty(uuid, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.use_promo_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.use_promo_code(text) TO authenticated, service_role;