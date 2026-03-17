
CREATE OR REPLACE FUNCTION public.use_promo_code(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE code = _code AND active = true;
END;
$$;
