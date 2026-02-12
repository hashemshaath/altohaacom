
-- Add profile section visibility settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS section_visibility jsonb DEFAULT '{"bio": true, "career": true, "education": true, "memberships": true, "certificates": true, "competitions": true, "social": true, "contact": true, "badges": true}'::jsonb;

-- Add services offered flag
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS offers_services boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS services_description text,
ADD COLUMN IF NOT EXISTS services_description_ar text;
