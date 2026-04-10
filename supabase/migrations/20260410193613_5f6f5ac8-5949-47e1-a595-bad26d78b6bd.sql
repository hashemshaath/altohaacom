-- Fix round_participants: replace broad policy with scoped one
DROP POLICY IF EXISTS "Authenticated can view round participants" ON public.round_participants;
CREATE POLICY "Scoped view round participants"
  ON public.round_participants
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM public.competition_registrations WHERE participant_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Fix entity_competition_participations: replace broad with admin-only
DROP POLICY IF EXISTS "Authenticated can view participations" ON public.entity_competition_participations;
CREATE POLICY "Admin view entity participations"
  ON public.entity_competition_participations
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));