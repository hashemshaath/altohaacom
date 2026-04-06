DROP POLICY "Authenticated users can insert venues" ON public.exhibition_venues;
DROP POLICY "Authenticated users can update venues" ON public.exhibition_venues;

CREATE POLICY "Admins can insert venues"
  ON public.exhibition_venues FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update venues"
  ON public.exhibition_venues FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));