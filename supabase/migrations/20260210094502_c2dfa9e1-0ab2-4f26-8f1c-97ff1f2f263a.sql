
-- Add photo_url and attendance fields to competition_team_members
ALTER TABLE public.competition_team_members
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_checked_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS title_ar TEXT;

-- Add category_id to competition_invitations for category targeting
ALTER TABLE public.competition_invitations
ADD COLUMN IF NOT EXISTS invitee_name_ar TEXT,
ADD COLUMN IF NOT EXISTS message_ar TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.competition_categories(id),
ADD COLUMN IF NOT EXISTS invitation_channel TEXT DEFAULT 'email';

-- Add category column to reference_gallery for image categorization
ALTER TABLE public.reference_gallery
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT;
