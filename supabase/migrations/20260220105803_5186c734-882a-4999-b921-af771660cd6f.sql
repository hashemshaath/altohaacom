
-- Fix 1: post_polls INSERT - restrict to authenticated post authors
DROP POLICY IF EXISTS "Authenticated users can create polls" ON public.post_polls;
CREATE POLICY "Post authors can create polls"
  ON public.post_polls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id AND posts.author_id = auth.uid()
    )
  );

-- Fix 2: post_poll_options INSERT - restrict to authenticated poll owners
DROP POLICY IF EXISTS "Authenticated users can create poll options" ON public.post_poll_options;
CREATE POLICY "Poll owners can create options"
  ON public.post_poll_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.post_polls pp
      JOIN public.posts p ON p.id = pp.post_id
      WHERE pp.id = poll_id AND p.author_id = auth.uid()
    )
  );

-- Fix 3: ad_user_behaviors INSERT - allow both anonymous tracking and authenticated
-- This is intentional analytics tracking, but tighten to ensure user_id matches if provided
DROP POLICY IF EXISTS "Anyone can insert their own behavior events" ON public.ad_user_behaviors;
CREATE POLICY "Users can insert own behavior events"
  ON public.ad_user_behaviors
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );
