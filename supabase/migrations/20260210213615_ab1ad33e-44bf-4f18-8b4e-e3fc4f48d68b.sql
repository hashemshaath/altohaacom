
-- Add nutritional data columns to recipes
ALTER TABLE public.recipes 
  ADD COLUMN IF NOT EXISTS calories integer,
  ADD COLUMN IF NOT EXISTS protein_g numeric(6,1),
  ADD COLUMN IF NOT EXISTS carbs_g numeric(6,1),
  ADD COLUMN IF NOT EXISTS fat_g numeric(6,1),
  ADD COLUMN IF NOT EXISTS fiber_g numeric(6,1),
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'main_course',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS country_code char(2),
  ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs for existing recipes
UPDATE public.recipes SET slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '''', '')) WHERE slug IS NULL;

-- Create index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_slug ON public.recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON public.recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON public.recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON public.recipes(is_published);
