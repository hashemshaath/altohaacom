-- Add slug column
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitions_slug ON public.competitions(slug);

-- Populate existing rows
UPDATE public.competitions 
SET slug = lower(regexp_replace(
  regexp_replace(
    coalesce(title, title_ar, id::text),
    '[^a-zA-Z0-9\s-]', '', 'g'
  ),
  '[\s]+', '-', 'g'
))
WHERE slug IS NULL;