
-- Add education and experience fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS education_institution TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.education_level IS 'Highest education level: high_school, diploma, bachelors, masters, doctorate, other';
COMMENT ON COLUMN public.profiles.education_institution IS 'Name of educational institution';
COMMENT ON COLUMN public.profiles.years_of_experience IS 'Total years of professional culinary experience';
