-- Allow judges to delete their own scores (needed for upsert/re-scoring)
CREATE POLICY "Judges can delete their own scores"
ON public.competition_scores
FOR DELETE
USING (judge_id = auth.uid());