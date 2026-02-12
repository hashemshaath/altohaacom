
-- Add location coordinates to culinary_entities for Google Maps integration
ALTER TABLE public.culinary_entities 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add education_entity_id to profiles to link users to educational institutions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS education_entity_id UUID REFERENCES public.culinary_entities(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_education_entity_id ON public.profiles(education_entity_id);
CREATE INDEX IF NOT EXISTS idx_culinary_entities_type_country ON public.culinary_entities(type, country);
