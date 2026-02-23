-- Add 'pending' value to exhibition_status enum
ALTER TYPE public.exhibition_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'draft';

-- Add 'pending' value to competition_status enum
ALTER TYPE public.competition_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'draft';