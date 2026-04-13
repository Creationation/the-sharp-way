
-- Create storage bucket for barber photos
INSERT INTO storage.buckets (id, name, public) VALUES ('barber-photos', 'barber-photos', true);

-- Anyone can view barber photos
CREATE POLICY "Barber photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'barber-photos');

-- Only admins can upload barber photos
CREATE POLICY "Admins can upload barber photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'barber-photos' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update barber photos
CREATE POLICY "Admins can update barber photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'barber-photos' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete barber photos
CREATE POLICY "Admins can delete barber photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'barber-photos' AND public.has_role(auth.uid(), 'admin'));
