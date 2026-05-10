-- 1. Promo codes : restrict SELECT to authenticated + active only
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;

CREATE POLICY "Authenticated can read active promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (active = true);

-- Public-safe view exposing ONLY non-sensitive promo fields (no stripe_coupon_id)
CREATE OR REPLACE VIEW public.promo_codes_public
WITH (security_invoker = true)
AS
SELECT
  id,
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  current_uses,
  expires_at,
  active
FROM public.promo_codes
WHERE active = true;

GRANT SELECT ON public.promo_codes_public TO anon, authenticated;

-- 2. Remove bookings from realtime publication (use 30s polling instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings';
  END IF;
END $$;

-- 3. Lock down admin SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.admin_adjust_loyalty(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_loyalty(uuid, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.use_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_promo_code(text) TO authenticated;