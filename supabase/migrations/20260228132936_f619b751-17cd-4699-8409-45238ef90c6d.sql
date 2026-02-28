
-- Fix: Create trigger to auto-assign account_number on profile insert
CREATE OR REPLACE FUNCTION public.assign_account_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_number INTEGER;
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    UPDATE public.account_sequences
    SET last_number = last_number + 1
    WHERE role = 'chef'
    RETURNING last_number INTO v_number;

    -- If no row existed, initialize
    IF v_number IS NULL THEN
      INSERT INTO public.account_sequences (role, last_number) VALUES ('chef', 1)
      ON CONFLICT (role) DO UPDATE SET last_number = account_sequences.last_number + 1
      RETURNING last_number INTO v_number;
    END IF;

    NEW.account_number := 'U' || LPAD(v_number::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER trigger_assign_account_number
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_account_number();

-- Fix Sarah's missing account number
UPDATE public.profiles
SET account_number = (
  SELECT 'U' || LPAD((SELECT last_number + 1 FROM account_sequences WHERE role = 'chef')::TEXT, 8, '0')
)
WHERE user_id = '60895cdf-ca7c-4506-ab8a-b7ba8afa137d' AND account_number IS NULL;

UPDATE public.account_sequences SET last_number = last_number + 1 WHERE role = 'chef';
