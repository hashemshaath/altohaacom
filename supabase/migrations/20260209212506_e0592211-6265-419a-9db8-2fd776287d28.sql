
-- Add organizer_logo_url column to exhibitions
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS organizer_logo_url TEXT;
