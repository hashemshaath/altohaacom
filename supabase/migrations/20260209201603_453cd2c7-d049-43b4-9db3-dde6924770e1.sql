
-- Auto-assign competition_number on insert when country_code and edition_year are provided
CREATE OR REPLACE FUNCTION public.assign_competition_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.competition_number IS NULL AND NEW.country_code IS NOT NULL AND NEW.edition_year IS NOT NULL THEN
    NEW.competition_number := public.generate_competition_number(NEW.country_code, NEW.edition_year);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_competition_number
  BEFORE INSERT ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.assign_competition_number();
