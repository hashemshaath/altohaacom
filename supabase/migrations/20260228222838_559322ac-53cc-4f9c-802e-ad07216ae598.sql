
-- Add founded_year to organizers
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Function to refresh organizer stats from linked exhibitions
CREATE OR REPLACE FUNCTION public.refresh_organizer_stats(p_organizer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total INTEGER;
  v_avg NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM exhibitions WHERE organizer_id = p_organizer_id;

  SELECT COALESCE(AVG(r.rating), 0) INTO v_avg
  FROM exhibition_reviews r
  JOIN exhibitions e ON e.id = r.exhibition_id
  WHERE e.organizer_id = p_organizer_id;

  UPDATE organizers SET
    total_exhibitions = v_total,
    average_rating = ROUND(v_avg, 2),
    updated_at = now()
  WHERE id = p_organizer_id;
END;
$$;

-- Trigger to auto-refresh stats when exhibition is linked/unlinked
CREATE OR REPLACE FUNCTION public.trigger_refresh_organizer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.organizer_id IS NOT NULL THEN
      PERFORM public.refresh_organizer_stats(OLD.organizer_id);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.organizer_id IS NOT NULL THEN
    PERFORM public.refresh_organizer_stats(NEW.organizer_id);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.organizer_id IS DISTINCT FROM NEW.organizer_id AND OLD.organizer_id IS NOT NULL THEN
    PERFORM public.refresh_organizer_stats(OLD.organizer_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_organizer_stats ON exhibitions;
CREATE TRIGGER trg_refresh_organizer_stats
AFTER INSERT OR UPDATE OF organizer_id OR DELETE ON exhibitions
FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_organizer_stats();

-- Function to increment organizer views
CREATE OR REPLACE FUNCTION public.increment_organizer_views(p_organizer_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE organizers SET total_views = COALESCE(total_views, 0) + 1 WHERE id = p_organizer_id;
$$;
