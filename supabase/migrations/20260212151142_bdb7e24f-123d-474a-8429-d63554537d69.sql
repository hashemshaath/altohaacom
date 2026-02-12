-- Change default preferred_language to Arabic for new users
ALTER TABLE public.profiles ALTER COLUMN preferred_language SET DEFAULT 'ar';

-- Update existing users who still have the old default 'en' and haven't explicitly changed it
-- (Only update if they haven't customized their language)
-- We won't force-update existing users as they may have chosen English intentionally
