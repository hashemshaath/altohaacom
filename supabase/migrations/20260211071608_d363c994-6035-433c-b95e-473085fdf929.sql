
-- Fix RLS: restrict score image insert to authenticated judges
DROP POLICY IF EXISTS "Judges can insert score images" ON public.tasting_score_images;
CREATE POLICY "Authenticated users can insert score images"
  ON public.tasting_score_images FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow update/delete only by the score owner
CREATE POLICY "Score owners can delete images"
  ON public.tasting_score_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasting_scores ts
      WHERE ts.id = tasting_score_images.score_id AND ts.judge_id = auth.uid()
    )
  );
