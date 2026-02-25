
-- Remove the restrictive check constraint on record_type to allow custom section keys
ALTER TABLE public.user_career_records DROP CONSTRAINT user_career_records_record_type_check;
