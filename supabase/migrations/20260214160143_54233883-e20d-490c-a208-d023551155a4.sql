
-- Fix overly permissive conversion_events INSERT policy
DROP POLICY IF EXISTS "Public can insert conversions" ON public.conversion_events;

-- Allow both authenticated and anonymous tracking via a single policy
-- Anonymous users can track but the user_id will be null
CREATE POLICY "Anyone can insert conversion events" ON public.conversion_events 
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
