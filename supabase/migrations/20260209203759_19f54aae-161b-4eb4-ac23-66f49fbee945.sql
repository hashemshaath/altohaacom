
-- Invitation table for competition participant invitations
CREATE TABLE public.competition_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invitee_email TEXT,
  invitee_name TEXT,
  invitee_name_ar TEXT,
  organization_name TEXT,
  organization_name_ar TEXT,
  organization_type TEXT, -- hotel, restaurant, institution, university, other
  message TEXT,
  message_ar TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_invitations ENABLE ROW LEVEL SECURITY;

-- Organizers can read invitations for their competitions
CREATE POLICY "Organizers can view invitations"
  ON public.competition_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions
      WHERE id = competition_id AND organizer_id = auth.uid()
    )
    OR invited_by = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Organizers can create invitations
CREATE POLICY "Organizers can create invitations"
  ON public.competition_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitions
      WHERE id = competition_id AND organizer_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Organizers can update invitations
CREATE POLICY "Organizers can update invitations"
  ON public.competition_invitations FOR UPDATE
  USING (
    invited_by = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Organizers can delete invitations
CREATE POLICY "Organizers can delete invitations"
  ON public.competition_invitations FOR DELETE
  USING (
    invited_by = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE INDEX idx_competition_invitations_comp ON public.competition_invitations(competition_id, created_at DESC);
