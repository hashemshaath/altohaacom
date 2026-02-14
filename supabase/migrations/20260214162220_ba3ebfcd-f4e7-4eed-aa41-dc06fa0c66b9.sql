-- Allow any user (including anonymous) to insert their own page view events
CREATE POLICY "Anyone can insert their own behavior events"
  ON public.ad_user_behaviors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow anon for non-logged-in visitors
CREATE POLICY "Anon can insert behavior events"
  ON public.ad_user_behaviors
  FOR INSERT
  TO anon
  WITH CHECK (true);