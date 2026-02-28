-- Add satisfaction rating columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS satisfaction_rating integer,
ADD COLUMN IF NOT EXISTS satisfaction_feedback text;