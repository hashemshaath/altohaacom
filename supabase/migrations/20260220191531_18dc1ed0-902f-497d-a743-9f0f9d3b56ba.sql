
-- Add advanced configuration columns to homepage_sections
ALTER TABLE public.homepage_sections
  ADD COLUMN IF NOT EXISTS spacing TEXT NOT NULL DEFAULT 'normal' CHECK (spacing IN ('none', 'compact', 'normal', 'relaxed')),
  ADD COLUMN IF NOT EXISTS animation TEXT NOT NULL DEFAULT 'fade' CHECK (animation IN ('none', 'fade', 'slide-up', 'slide-left', 'scale', 'blur')),
  ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS css_class TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_en TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS max_items_mobile INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS container_width TEXT NOT NULL DEFAULT 'default' CHECK (container_width IN ('default', 'narrow', 'wide', 'full'));
