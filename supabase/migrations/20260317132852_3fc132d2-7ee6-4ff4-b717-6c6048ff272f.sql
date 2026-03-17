
-- Table for users to request their reward when they reach 10 stamps
CREATE TABLE public.reward_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stamps_at_request integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

-- Users can create reward requests
CREATE POLICY "Users can create reward requests"
ON public.reward_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own reward requests"
ON public.reward_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all requests
CREATE POLICY "Admins can manage reward requests"
ON public.reward_requests FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
