-- Fix function search path for validate_username
CREATE OR REPLACE FUNCTION public.validate_username(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Username rules: 3-30 chars, alphanumeric + underscore, must start with letter
  RETURN p_username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,29}$';
END;
$$;