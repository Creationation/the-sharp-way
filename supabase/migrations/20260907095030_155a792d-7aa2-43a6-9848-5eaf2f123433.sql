CREATE TABLE public.password_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  status text NOT NULL,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.password_change_log TO authenticated;
GRANT ALL ON public.password_change_log TO service_role;

ALTER TABLE public.password_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own password change log"
ON public.password_change_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all password change logs"
ON public.password_change_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_password_change_log_user ON public.password_change_log (user_id, created_at DESC);