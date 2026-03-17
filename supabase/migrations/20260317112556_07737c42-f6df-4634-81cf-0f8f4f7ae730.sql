
CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty_en text NOT NULL DEFAULT '',
  specialty_de text NOT NULL DEFAULT '',
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  cuts integer NOT NULL DEFAULT 0,
  years integer NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read barbers"
ON public.barbers FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage barbers"
ON public.barbers FOR ALL TO public
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed existing barbers
INSERT INTO public.barbers (name, specialty_en, specialty_de, rating, cuts, years, image_url, available, sort_order) VALUES
('Marco', 'Classic Cuts & Hot Towel Shaves', 'Klassische Schnitte & Bartrasur', 4.9, 847, 12, '/barber-1', true, 1),
('Lukas', 'Fades, Tapers & Modern Styles', 'Fades, Tapers & Moderne Styles', 4.8, 623, 7, '/barber-2', true, 2),
('Daniel', 'Beard Sculpting', 'Bart-Sculpting', 4.7, 510, 9, '/barber-3', false, 3);
