-- Fix: Allow public (unauthenticated) read access to profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);
