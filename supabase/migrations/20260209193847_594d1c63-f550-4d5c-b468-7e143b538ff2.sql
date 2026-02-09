
-- Add new columns to competition_categories
ALTER TABLE public.competition_categories 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'mixed' CHECK (gender IN ('male', 'female', 'mixed')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'suspended'));

-- Create competition_team_members table for support team, assistants, etc.
CREATE TABLE IF NOT EXISTS public.competition_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  name_ar TEXT,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'volunteer', 'coordinator', 'kitchen_marshal', 'timekeeper', 'photographer', 'mc', 'other')),
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competition_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team members
CREATE POLICY "Anyone can view team members"
ON public.competition_team_members FOR SELECT
USING (true);

CREATE POLICY "Organizers can manage team members"
ON public.competition_team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.competitions c 
    WHERE c.id = competition_id AND c.organizer_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);
