
-- Fix: drop the conflicting index and re-create it safely
DROP INDEX IF EXISTS idx_competitions_series;
CREATE INDEX idx_competitions_series ON public.competitions(series_id);
