
-- Add country_code to user_career_records for city/country tracking across all sections
ALTER TABLE public.user_career_records ADD COLUMN IF NOT EXISTS country_code TEXT;
