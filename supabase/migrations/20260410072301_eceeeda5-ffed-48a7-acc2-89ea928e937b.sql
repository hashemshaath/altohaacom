
-- Fix poll_votes: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view votes" ON public.poll_votes;
CREATE POLICY "Authenticated users can view votes"
  ON public.poll_votes
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix post_poll_votes: restrict SELECT to authenticated users only  
DROP POLICY IF EXISTS "Anyone can view votes" ON public.post_poll_votes;
CREATE POLICY "Authenticated users can view votes"
  ON public.post_poll_votes
  FOR SELECT
  TO authenticated
  USING (true);
