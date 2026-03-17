-- Loyalty reward redemption requests (user sends when they reach 10 stamps)
CREATE TABLE IF NOT EXISTS public.loyalty_reward_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name  TEXT,
  user_email TEXT,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_reward_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reward requests"
  ON public.loyalty_reward_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can read reward requests"
  ON public.loyalty_reward_requests FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reward requests"
  ON public.loyalty_reward_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
