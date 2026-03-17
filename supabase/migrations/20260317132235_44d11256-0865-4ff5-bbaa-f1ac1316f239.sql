
-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id integer PRIMARY KEY DEFAULT 1,
  email_reminders boolean NOT NULL DEFAULT true,
  reminder_24h boolean NOT NULL DEFAULT true,
  reminder_5h boolean NOT NULL DEFAULT true,
  reminder_2h boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.notification_settings (id) VALUES (1);

-- RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification settings"
ON public.notification_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read notification settings"
ON public.notification_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add reminder tracking columns to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS reminder_sent_24h boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_5h boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_2h boolean NOT NULL DEFAULT false;
