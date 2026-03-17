
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('banner', 'promo_card')),
  active boolean NOT NULL DEFAULT true,
  title_en text NOT NULL DEFAULT '',
  title_de text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_de text NOT NULL DEFAULT '',
  link_text_en text NOT NULL DEFAULT '',
  link_text_de text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotions"
ON public.promotions FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL TO public
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed default data
INSERT INTO public.promotions (type, active, title_en, title_de, subtitle_en, subtitle_de, link_text_en, link_text_de) VALUES
('banner', true, 'Hot Towel Shave now available', 'Hot Towel Rasur jetzt verfügbar', '', '', 'Book Today', 'Heute buchen'),
('promo_card', true, 'STYLE UPGRADE ✂️', 'STYLE UPGRADE ✂️', 'First visit? 20% OFF — Code: SHARP20', 'Erstbesuch? 20% Rabatt — Code: SHARP20', 'Book Now', 'Jetzt buchen');
