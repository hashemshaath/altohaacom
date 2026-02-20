
-- Add template and design fields to hero_slides
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS text_position text NOT NULL DEFAULT 'bottom-left',
  ADD COLUMN IF NOT EXISTS overlay_opacity integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS overlay_color text NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS height_preset text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS custom_height integer,
  ADD COLUMN IF NOT EXISTS badge_text text,
  ADD COLUMN IF NOT EXISTS badge_text_ar text,
  ADD COLUMN IF NOT EXISTS cta_secondary_label text,
  ADD COLUMN IF NOT EXISTS cta_secondary_label_ar text,
  ADD COLUMN IF NOT EXISTS cta_secondary_url text,
  ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS gradient_direction text NOT NULL DEFAULT 'to-right',
  ADD COLUMN IF NOT EXISTS autoplay_interval integer NOT NULL DEFAULT 6000;

-- Update existing slides with default values
UPDATE public.hero_slides SET template = 'classic' WHERE template IS NULL OR template = '';
