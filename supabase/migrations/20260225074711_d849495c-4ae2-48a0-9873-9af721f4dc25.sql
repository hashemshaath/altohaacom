-- Add entity_name_ar column for proper bilingual support
ALTER TABLE public.user_career_records 
ADD COLUMN IF NOT EXISTS entity_name_ar TEXT;