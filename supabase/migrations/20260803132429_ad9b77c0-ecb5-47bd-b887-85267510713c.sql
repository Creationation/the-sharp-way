CREATE TABLE public.barber_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  active boolean NOT NULL DEFAULT true,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barber_id, weekday)
);

GRANT SELECT ON public.barber_working_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barber_working_hours TO authenticated;
GRANT ALL ON public.barber_working_hours TO service_role;

ALTER TABLE public.barber_working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read working hours" ON public.barber_working_hours FOR SELECT USING (true);
CREATE POLICY "Admins can insert working hours" ON public.barber_working_hours FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update working hours" ON public.barber_working_hours FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete working hours" ON public.barber_working_hours FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_barber_working_hours_updated_at BEFORE UPDATE ON public.barber_working_hours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.barber_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.barber_absences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barber_absences TO authenticated;
GRANT ALL ON public.barber_absences TO service_role;

ALTER TABLE public.barber_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read absences" ON public.barber_absences FOR SELECT USING (true);
CREATE POLICY "Admins can insert absences" ON public.barber_absences FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update absences" ON public.barber_absences FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete absences" ON public.barber_absences FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_barber_absences_updated_at BEFORE UPDATE ON public.barber_absences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_absence_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be on or after start_date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_barber_absence_dates BEFORE INSERT OR UPDATE ON public.barber_absences FOR EACH ROW EXECUTE FUNCTION public.validate_absence_dates();