-- Grant admin role to i.tuerk@outlook.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('2ffe6527-c4ff-40f6-9f28-5fbdad8a76ae', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow admins to view, insert and delete user roles (admin management)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
