
-- post_likes: drop old public policy
DROP POLICY IF EXISTS "Authenticated can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
CREATE POLICY "Authenticated can view likes"
ON public.post_likes FOR SELECT TO authenticated
USING (true);

-- post_reposts: drop old then recreate
DROP POLICY IF EXISTS "Authenticated can view reposts" ON public.post_reposts;
DROP POLICY IF EXISTS "Anyone can view post reposts" ON public.post_reposts;
CREATE POLICY "Authenticated can view reposts"
ON public.post_reposts FOR SELECT TO authenticated
USING (true);
