-- Add second nationality and visibility control to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS second_nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_nationality BOOLEAN DEFAULT true;
