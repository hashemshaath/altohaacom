
-- Fix: Split the ALL policy into specific operation policies
DROP POLICY IF EXISTS "Organizers can manage team members" ON public.competition_team_members;

CREATE POLICY "Organizers can insert team members"
ON public.competition_team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.competitions c 
    WHERE c.id = competition_id AND c.organizer_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Organizers can update team members"
ON public.competition_team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.competitions c 
    WHERE c.id = competition_id AND c.organizer_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Organizers can delete team members"
ON public.competition_team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.competitions c 
    WHERE c.id = competition_id AND c.organizer_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);
