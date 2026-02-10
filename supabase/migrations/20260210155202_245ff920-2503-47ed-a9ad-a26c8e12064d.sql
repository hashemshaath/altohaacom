-- Fix legacy account numbers to unified U prefix
UPDATE public.profiles SET account_number = 'U00000005' WHERE account_number = 'CHF-0001';
UPDATE public.profiles SET account_number = 'U00000006' WHERE account_number = 'JDG-0001';
UPDATE public.profiles SET account_number = 'U00000007' WHERE account_number = 'ORG-0001';

-- Set global counter to current max
UPDATE public.account_sequences SET last_number = 7 WHERE role = 'chef';
UPDATE public.account_sequences SET last_number = 0 WHERE role != 'chef';

-- Update function to use single global counter
CREATE OR REPLACE FUNCTION public.generate_account_number(p_role app_role)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_number INTEGER;
BEGIN
  UPDATE public.account_sequences
  SET last_number = last_number + 1
  WHERE role = 'chef'
  RETURNING last_number INTO v_number;

  RETURN 'U' || LPAD(v_number::TEXT, 8, '0');
END;
$function$;