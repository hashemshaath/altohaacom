-- Add flag_status and detailed_feedback to competition_scores
ALTER TABLE public.competition_scores 
  ADD COLUMN IF NOT EXISTS flag_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flag_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS detailed_feedback text DEFAULT NULL;

-- Create index for flagged entries
CREATE INDEX IF NOT EXISTS idx_scores_flag_status ON public.competition_scores(flag_status) WHERE flag_status IS NOT NULL;