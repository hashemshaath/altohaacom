-- 1. Fix tasting_sessions SELECT: remove broad status-based access
DROP POLICY IF EXISTS "Users can view relevant tasting sessions" ON public.tasting_sessions;
CREATE POLICY "Users can view relevant tasting sessions"
  ON public.tasting_sessions
  FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tasting_scores ts
      WHERE ts.session_id = tasting_sessions.id AND ts.judge_id = auth.uid()
    )
  );

-- 2. Fix tasting_entries SELECT: restrict to organizer/judges/chef/admin
DROP POLICY IF EXISTS "Scoped tasting entries access" ON public.tasting_entries;
CREATE POLICY "Scoped tasting entries access"
  ON public.tasting_entries
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR chef_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tasting_sessions ts
      WHERE ts.id = tasting_entries.session_id
      AND ts.organizer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tasting_scores sc
      WHERE sc.entry_id = tasting_entries.id
      AND sc.judge_id = auth.uid()
    )
  );

-- 3. Fix tasting_scores UPDATE: prevent after session completion
DROP POLICY IF EXISTS "Judges can update their scores" ON public.tasting_scores;
CREATE POLICY "Judges can update scores for active sessions"
  ON public.tasting_scores
  FOR UPDATE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasting_sessions ts
      WHERE ts.id = tasting_scores.session_id
      AND ts.status NOT IN ('completed', 'cancelled')
    )
  );

-- 4. Fix tasting_scores DELETE: prevent after session completion
DROP POLICY IF EXISTS "Judges can delete their scores" ON public.tasting_scores;
CREATE POLICY "Judges can delete scores for active sessions"
  ON public.tasting_scores
  FOR DELETE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasting_sessions ts
      WHERE ts.id = tasting_scores.session_id
      AND ts.status NOT IN ('completed', 'cancelled')
    )
  );