
-- 1) tasting_score_images: restrict to session participants only
DROP POLICY IF EXISTS "Score images viewable by session participants" ON public.tasting_score_images;
CREATE POLICY "Score images viewable by session participants"
ON public.tasting_score_images FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasting_scores ts
    JOIN public.tasting_sessions sess ON sess.id = ts.session_id
    WHERE ts.id = tasting_score_images.score_id
    AND (
      ts.judge_id = auth.uid()
      OR sess.organizer_id = auth.uid()
      OR is_admin(auth.uid())
    )
  )
);

-- 2) tasting_scores: remove blanket authenticated access for completed sessions
DROP POLICY IF EXISTS "Judges and organizers can view scores" ON public.tasting_scores;
CREATE POLICY "Judges and organizers can view scores"
ON public.tasting_scores FOR SELECT TO authenticated
USING (
  auth.uid() = judge_id
  OR EXISTS (
    SELECT 1 FROM public.tasting_sessions ts
    WHERE ts.id = tasting_scores.session_id AND ts.organizer_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- 3) user-media: add folder ownership check
DROP POLICY IF EXISTS "Users can view own media or public profiles" ON storage.objects;
CREATE POLICY "Users can view user media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin(auth.uid())
  )
);

-- Also allow anon for public profile images (avatars displayed on public pages)
CREATE POLICY "Public can view user media avatars"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'user-media');
