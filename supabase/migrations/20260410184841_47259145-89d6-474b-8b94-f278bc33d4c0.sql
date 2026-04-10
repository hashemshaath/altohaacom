
-- 1. Secure view for round_participants
DROP VIEW IF EXISTS public.round_participants_safe;
CREATE VIEW public.round_participants_safe WITH (security_invoker = on) AS
SELECT
  rp.id,
  rp.round_id,
  rp.registration_id,
  rp.status,
  rp.advanced_to_round_id,
  rp.created_at,
  CASE
    WHEN cr.status IN ('completed', 'finished')
      OR public.is_admin(auth.uid())
    THEN rp.total_score
    ELSE NULL
  END AS total_score
FROM public.round_participants rp
JOIN public.competition_rounds cr ON cr.id = rp.round_id;

-- 2. tasting_entries: scoped SELECT policy
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tasting_entries' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasting_entries', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Scoped tasting entries access"
ON public.tasting_entries FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tasting_sessions ts
    WHERE ts.id = tasting_entries.session_id
    AND ts.organizer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.tasting_sessions ts
    WHERE ts.id = tasting_entries.session_id
    AND ts.is_blind_tasting = false
  )
  OR tasting_entries.chef_id = auth.uid()
);
