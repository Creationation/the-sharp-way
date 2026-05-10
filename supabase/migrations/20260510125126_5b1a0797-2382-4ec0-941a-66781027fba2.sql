
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 30,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.services (name, name_en, price, duration_min, sort_order) VALUES
  ('Haarschnitt', 'Haircut', 20, 30, 1),
  ('Maschinenschnitt', 'Machine Cut', 15, 20, 2),
  ('Haarschnitt + Waschen/Föhnen', 'Haircut + Wash/Blow-dry', 25, 45, 3),
  ('Haarschnitt + Komplett Service', 'Haircut + Full Service', 38, 60, 4),
  ('Moderne Bartrasur', 'Modern Beard Shave', 15, 20, 5),
  ('Bart Rasur', 'Beard Trim', 10, 15, 6),
  ('Haare färben', 'Hair Coloring', 35, 60, 7),
  ('Kinder Haarschnitt (bis 10 J.)', 'Kids Haircut (up to 10y)', 16, 20, 8);
