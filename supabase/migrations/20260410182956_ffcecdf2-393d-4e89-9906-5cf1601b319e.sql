
-- 1. Fix blind judging bypass in competition_scores
DROP POLICY IF EXISTS "Judges can view scores they gave" ON public.competition_scores;
CREATE POLICY "Judges can view scores they gave"
ON public.competition_scores FOR SELECT TO authenticated
USING (
  judge_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM competition_registrations cr
    JOIN competitions c ON c.id = cr.competition_id
    WHERE cr.id = competition_scores.registration_id
    AND c.organizer_id = auth.uid()
  )
  OR (
    EXISTS (
      SELECT 1 FROM competition_registrations cr
      WHERE cr.id = competition_scores.registration_id
      AND cr.participant_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM competition_registrations cr
      JOIN competitions c ON c.id = cr.competition_id
      WHERE cr.id = competition_scores.registration_id
      AND c.blind_judging_enabled = true
    )
  )
);

-- 2. Fix requirement_list_assignments — verify list ownership
DROP POLICY IF EXISTS "Admins and creators can manage assignments" ON public.requirement_list_assignments;
CREATE POLICY "List owners and admins can manage assignments"
ON public.requirement_list_assignments FOR ALL TO authenticated
USING (
  assigned_by = auth.uid()
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  (
    assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.requirement_lists rl
      WHERE rl.id = requirement_list_assignments.list_id
      AND rl.created_by = auth.uid()
    )
  )
  OR public.is_admin(auth.uid())
);
