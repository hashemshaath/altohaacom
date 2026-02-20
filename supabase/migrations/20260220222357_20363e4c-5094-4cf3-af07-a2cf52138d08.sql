
-- Add new columns to hero_slides for enhanced control
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS animation_effect TEXT NOT NULL DEFAULT 'fade',
  ADD COLUMN IF NOT EXISTS object_fit TEXT NOT NULL DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS object_position TEXT NOT NULL DEFAULT 'center';
