
-- Create sequence for entity numbering
CREATE SEQUENCE IF NOT EXISTS public.entity_number_seq START WITH 1;

-- Set sequence to current count to avoid conflicts
SELECT setval('public.entity_number_seq', COALESCE((SELECT COUNT(*) FROM public.culinary_entities WHERE entity_number IS NOT NULL), 0) + 1, false);

-- Create function to generate entity number: ENT{8-digit SEQ}
CREATE OR REPLACE FUNCTION public.generate_entity_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  v_seq := nextval('public.entity_number_seq');
  RETURN 'ENT' || LPAD(v_seq::TEXT, 8, '0');
END;
$$;

-- Create trigger to auto-assign entity number
CREATE OR REPLACE FUNCTION public.assign_entity_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.entity_number IS NULL OR NEW.entity_number = '' THEN
    NEW.entity_number := public.generate_entity_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_entity_number ON public.culinary_entities;
CREATE TRIGGER trigger_set_entity_number
  BEFORE INSERT ON public.culinary_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_entity_number();

-- Update existing entities with old format to new sequential format
DO $$
DECLARE
  r RECORD;
  v_counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM public.culinary_entities ORDER BY created_at ASC
  LOOP
    UPDATE public.culinary_entities 
    SET entity_number = 'ENT' || LPAD(v_counter::TEXT, 8, '0')
    WHERE id = r.id;
    v_counter := v_counter + 1;
  END LOOP;
  -- Reset sequence to next value
  PERFORM setval('public.entity_number_seq', v_counter, false);
END;
$$;
