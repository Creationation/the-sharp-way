CREATE POLICY "Admins can create bookings for anyone"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));