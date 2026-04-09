
-- Fix 1: Tighten posts SELECT policy to exclude private posts for non-owners
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can view published posts') THEN
    DROP POLICY "Anyone can view published posts" ON public.posts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can view posts') THEN
    DROP POLICY "Anyone can view posts" ON public.posts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Posts are viewable by everyone') THEN
    DROP POLICY "Posts are viewable by everyone" ON public.posts;
  END IF;
END $$;

CREATE POLICY "Public posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (
    (visibility = 'public' AND moderation_status = 'approved')
    OR author_id = auth.uid()
  );

-- Fix 2: Restrict knowledge-files storage bucket
DROP POLICY IF EXISTS "Anyone can view knowledge files" ON storage.objects;

CREATE POLICY "Authenticated users can view knowledge files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'knowledge-files'
    AND auth.role() = 'authenticated'
  );
