
-- Add A/B testing columns to social_link_items
ALTER TABLE public.social_link_items
  ADD COLUMN IF NOT EXISTS ab_variant_title TEXT,
  ADD COLUMN IF NOT EXISTS ab_variant_title_ar TEXT,
  ADD COLUMN IF NOT EXISTS ab_variant_icon TEXT,
  ADD COLUMN IF NOT EXISTS ab_variant_click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ab_enabled BOOLEAN DEFAULT false;
