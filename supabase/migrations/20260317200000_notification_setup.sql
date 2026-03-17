-- Track which reminder emails have been sent per booking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_5h  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_2h  BOOLEAN NOT NULL DEFAULT FALSE;

-- Global notification settings (singleton row id=1)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  email_reminders  BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_24h     BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_5h      BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_2h      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.notification_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notification settings"
  ON public.notification_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update notification settings"
  ON public.notification_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
