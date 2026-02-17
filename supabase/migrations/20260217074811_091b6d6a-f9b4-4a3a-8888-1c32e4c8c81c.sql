
-- Add video_url column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;
