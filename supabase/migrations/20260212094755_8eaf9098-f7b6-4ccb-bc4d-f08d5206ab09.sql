
-- Add global awards field to profiles (e.g. Michelin Star, Tabakh Star, etc.)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS global_awards jsonb DEFAULT '[]'::jsonb;

-- Each award entry: { "name": "Michelin Star", "name_ar": "نجمة ميشلان", "icon": "star", "year": 2024, "level": "1" }
COMMENT ON COLUMN public.profiles.global_awards IS 'Array of global culinary awards like Michelin Star, Tabakh Star, etc.';
