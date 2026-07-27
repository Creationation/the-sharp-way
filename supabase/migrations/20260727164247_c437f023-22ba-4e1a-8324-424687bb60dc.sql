CREATE TABLE public.barber_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.barber_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barber_photos TO authenticated;
GRANT ALL ON public.barber_photos TO service_role;

ALTER TABLE public.barber_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read barber photos" ON public.barber_photos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage barber photos" ON public.barber_photos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_barber_photos_updated_at
  BEFORE UPDATE ON public.barber_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_barber_photos_barber ON public.barber_photos(barber_id, sort_order);