-- Create barber_availability table
CREATE TABLE IF NOT EXISTS public.barber_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_name TEXT NOT NULL,
  date DATE NOT NULL,
  blocked_slots TEXT[] NOT NULL DEFAULT '{}',
  day_off BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (barber_name, date)
);

ALTER TABLE public.barber_availability ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read availability
CREATE POLICY "Anyone can read barber availability"
  ON public.barber_availability FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage barber availability"
  ON public.barber_availability FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_barber_availability_updated_at
  BEFORE UPDATE ON public.barber_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
