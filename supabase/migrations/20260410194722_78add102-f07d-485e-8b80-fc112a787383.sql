-- Fix competition_scores UPDATE: prevent after completion
DROP POLICY IF EXISTS "Judges can update own scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Judges can update scores for active competitions" ON public.competition_scores;
CREATE POLICY "Judges can update scores for active competitions"
  ON public.competition_scores
  FOR UPDATE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.competition_registrations cr
      JOIN public.competitions c ON c.id = cr.competition_id
      WHERE cr.id = competition_scores.registration_id
      AND c.status NOT IN ('completed', 'cancelled')
    )
  );

-- Fix competition_scores DELETE
DROP POLICY IF EXISTS "Judges can delete own scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Judges can delete scores for active competitions" ON public.competition_scores;
CREATE POLICY "Judges can delete scores for active competitions"
  ON public.competition_scores
  FOR DELETE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.competition_registrations cr
      JOIN public.competitions c ON c.id = cr.competition_id
      WHERE cr.id = competition_scores.registration_id
      AND c.status NOT IN ('completed', 'cancelled')
    )
  );