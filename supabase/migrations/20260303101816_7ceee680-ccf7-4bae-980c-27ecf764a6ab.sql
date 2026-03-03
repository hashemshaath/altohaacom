
ALTER TABLE public.homepage_sections 
  ADD COLUMN IF NOT EXISTS section_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'content',
  ADD COLUMN IF NOT EXISTS component_name TEXT;

CREATE OR REPLACE FUNCTION public.assign_section_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  IF NEW.section_number IS NULL OR NEW.section_number = '' THEN
    SELECT COUNT(*) + 1 INTO v_seq FROM homepage_sections WHERE section_number IS NOT NULL;
    NEW.section_number := 'HP-' || LPAD(v_seq::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_section_number ON public.homepage_sections;
CREATE TRIGGER trigger_assign_section_number
  BEFORE INSERT ON public.homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_section_number();
