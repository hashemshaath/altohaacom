
-- Add missing profile columns for privacy, job title, and additional social media
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS job_title_ar TEXT,
  ADD COLUMN IF NOT EXISTS tiktok TEXT,
  ADD COLUMN IF NOT EXISTS snapchat TEXT;

-- Add comment for profile_visibility
COMMENT ON COLUMN public.profiles.profile_visibility IS 'public, private, or followers_only';
