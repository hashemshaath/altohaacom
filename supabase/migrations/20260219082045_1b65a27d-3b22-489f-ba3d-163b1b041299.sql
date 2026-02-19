-- Fix get_user_company_id: add authorization check
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow querying own user_id or if admin
  IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT company_id FROM public.company_contacts WHERE user_id = p_user_id;
END;
$$;