-- Add competition-specific rules and knowledge summary fields
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS rules_summary TEXT,
ADD COLUMN IF NOT EXISTS rules_summary_ar TEXT,
ADD COLUMN IF NOT EXISTS scoring_notes TEXT,
ADD COLUMN IF NOT EXISTS scoring_notes_ar TEXT;