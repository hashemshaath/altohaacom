
-- Helper functions for auth flows that need to check phone/email existence
-- These bypass RLS via SECURITY DEFINER since callers may not be authenticated

CREATE OR REPLACE FUNCTION public.check_phone_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE phone = p_phone
  );
$$;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = lower(p_email)
  );
$$;

-- For phone-based sign-in: returns user_id and email for a given phone
CREATE OR REPLACE FUNCTION public.get_user_by_phone(p_phone text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.email
  FROM public.profiles p
  WHERE p.phone = p_phone
  LIMIT 1;
$$;
