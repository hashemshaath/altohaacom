
-- 1. exhibition_session_interactions: scope to session participants
DROP POLICY IF EXISTS "Authenticated can view session interactions" ON public.exhibition_session_interactions;

CREATE POLICY "Session participants can view interactions"
ON public.exhibition_session_interactions FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.exhibition_session_registrations esr
    WHERE esr.session_id = exhibition_session_interactions.session_id
    AND esr.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- 2. Blind judging: restrict judges from seeing participant identity when blind judging is enabled
-- We use a SECURITY DEFINER function to check blind judging status
CREATE OR REPLACE FUNCTION public.is_blind_judging_competition(p_competition_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT blind_judging_enabled FROM public.competitions WHERE id = p_competition_id),
    false
  );
$$;

-- Revoke anon execution
REVOKE EXECUTE ON FUNCTION public.is_blind_judging_competition(uuid) FROM anon;
