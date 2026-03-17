
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  stripe_coupon_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL TO public
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed the existing SHARP20 code
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, active)
VALUES ('SHARP20', 'First visit 20% off', 'percentage', 20, true);
