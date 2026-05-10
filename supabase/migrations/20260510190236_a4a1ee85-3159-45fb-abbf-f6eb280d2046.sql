-- Add new columns
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'herren',
  ADD COLUMN IF NOT EXISTS is_from_price boolean NOT NULL DEFAULT false;

-- Constrain category values
ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_category_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_category_check
  CHECK (category IN ('herren', 'damen', 'kinder'));

-- Replace dataset
DELETE FROM public.services;

INSERT INTO public.services (name, name_en, price, duration_min, sort_order, active, category, is_from_price) VALUES
-- HERREN
('Haarschnitt', 'Haircut', 20, 30, 1, true, 'herren', false),
('Maschinenschnitt', 'Machine Cut', 15, 20, 2, true, 'herren', false),
('Pensionisten Schnitt', 'Senior Cut', 18, 30, 3, true, 'herren', false),
('Moderne Bartrasur', 'Modern Beard Shave', 15, 20, 4, true, 'herren', false),
('Bart Rasur', 'Beard Shave', 12, 15, 5, true, 'herren', false),
('Haarschnitt + Waschen/Föhnen', 'Haircut + Wash/Blow-dry', 25, 45, 6, true, 'herren', false),
('Haarschnitt + W.F. (Komplett Service)', 'Haircut + Full Service', 38, 60, 7, true, 'herren', false),
('Haare Färben', 'Hair Color', 35, 60, 8, true, 'herren', false),
('Bart Färben', 'Beard Color', 20, 30, 9, true, 'herren', false),
('Waschen/Föhnen', 'Wash/Blow-dry', 10, 15, 10, true, 'herren', false),
('Augenbrauen Zupfen', 'Eyebrow Threading', 7, 10, 11, true, 'herren', false),
('Waxing', 'Waxing', 7, 10, 12, true, 'herren', false),
('Maske', 'Face Mask', 7, 15, 13, true, 'herren', false),

-- DAMEN (most are "ab" / from prices)
('Trockenschnitt', 'Dry Cut', 32, 30, 20, true, 'damen', true),
('Waschen + Schneiden', 'Wash & Cut', 35, 45, 21, true, 'damen', true),
('Waschen + Schneiden + Föhnen', 'Wash, Cut & Blow-dry', 45, 60, 22, true, 'damen', true),
('Waschen + Föhnen', 'Wash & Blow-dry', 30, 30, 23, true, 'damen', true),
('Ansatzfärben', 'Root Color', 45, 60, 24, true, 'damen', true),
('Komplettfärben', 'Full Color', 80, 90, 25, true, 'damen', true),
('Ansatz Blondieren', 'Root Bleach', 90, 90, 26, true, 'damen', true),
('Strähnen', 'Highlights', 80, 90, 27, true, 'damen', true),
('Balayage', 'Balayage', 150, 120, 28, true, 'damen', true),
('Dauerwelle', 'Perm', 60, 90, 29, true, 'damen', true),
('Locken', 'Curls', 45, 60, 30, true, 'damen', true),
('Tönung / Glossing', 'Tint / Glossing', 45, 60, 31, true, 'damen', true),
('Gesichtshaarentfernung', 'Facial Hair Removal', 25, 20, 32, true, 'damen', true),
('Augenbrauen zupfen', 'Eyebrow Threading', 8, 10, 33, true, 'damen', false),
('Augenbrauen färben', 'Eyebrow Tint', 8, 15, 34, true, 'damen', false),
('Wimpern färben', 'Lash Tint', 10, 15, 35, true, 'damen', false),
('Oberlippe zupfen', 'Upper Lip Threading', 8, 10, 36, true, 'damen', false),

-- KINDER
('Kinder Haarschnitt (bis 10 Jahre)', 'Kids Haircut (up to 10y)', 13, 20, 50, true, 'kinder', false),
('Kinder Waschen/Föhnen + Haarschnitt', 'Kids Wash/Blow-dry + Cut', 20, 30, 51, true, 'kinder', false),
('Mädchen unter 8 Jahre', 'Girls under 8y', 16, 20, 52, true, 'kinder', false);