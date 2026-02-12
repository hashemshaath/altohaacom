-- Add cover_image_url to competition_types for type covers
ALTER TABLE public.competition_types ADD COLUMN IF NOT EXISTS cover_image_url text;