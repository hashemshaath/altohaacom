
ALTER TABLE public.competition_invitations
  ADD COLUMN IF NOT EXISTS invitee_role text DEFAULT 'visitor',
  ADD COLUMN IF NOT EXISTS invitee_phone text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
