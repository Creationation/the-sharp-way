
CREATE TABLE public.user_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stamps integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  free_cuts_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_loyalty ENABLE ROW LEVEL SECURITY;

-- Users can read their own loyalty
CREATE POLICY "Users can read own loyalty"
ON public.user_loyalty FOR SELECT TO public
USING (auth.uid() = user_id);

-- Admins can manage all loyalty
CREATE POLICY "Admins can manage loyalty"
ON public.user_loyalty FOR ALL TO public
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-create loyalty row for existing users
INSERT INTO public.user_loyalty (user_id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;

-- Function to auto-create loyalty for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_loyalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_loyalty (user_id) VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function for admins to adjust loyalty
CREATE OR REPLACE FUNCTION public.admin_adjust_loyalty(
  _user_id uuid,
  _stamps integer,
  _points integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_loyalty (user_id, stamps, total_points)
  VALUES (_user_id, _stamps, _points)
  ON CONFLICT (user_id) DO UPDATE SET
    stamps = _stamps,
    total_points = _points,
    updated_at = now();
END;
$$;
