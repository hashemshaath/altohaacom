
-- Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the function now that pgcrypto is available
CREATE OR REPLACE FUNCTION public.generate_membership_verification()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code TEXT;
BEGIN
  v_code := UPPER(
    SUBSTRING(encode(extensions.digest(gen_random_uuid()::TEXT || now()::TEXT || random()::TEXT, 'sha256'), 'hex') FROM 1 FOR 16)
  );
  RETURN v_code;
END;
$function$;
