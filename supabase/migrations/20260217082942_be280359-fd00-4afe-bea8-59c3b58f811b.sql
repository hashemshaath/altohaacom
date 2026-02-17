-- Change posts default moderation_status from 'pending' to 'approved'
-- Clean posts will show immediately; the moderation function will change status only for violations
ALTER TABLE public.posts ALTER COLUMN moderation_status SET DEFAULT 'approved';