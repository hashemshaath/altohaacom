
-- Add participant_level column to competition_categories
ALTER TABLE public.competition_categories 
ADD COLUMN IF NOT EXISTS participant_level text DEFAULT 'open';

-- Add participant_level column to predefined_categories
ALTER TABLE public.predefined_categories 
ADD COLUMN IF NOT EXISTS participant_level text DEFAULT 'open';

-- Add comment for documentation
COMMENT ON COLUMN public.competition_categories.participant_level IS 'Participant level: open, amateur, chef, professional, international';
COMMENT ON COLUMN public.predefined_categories.participant_level IS 'Participant level: open, amateur, chef, professional, international';
