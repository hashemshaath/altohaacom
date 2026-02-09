
-- Create a security definer function to check company membership without recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_contacts WHERE user_id = p_user_id;
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Users can view their company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Company contacts can view their company" ON public.companies;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view their company contacts"
ON public.company_contacts
FOR SELECT
USING (
  company_id IN (SELECT public.get_user_company_id(auth.uid()))
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Company contacts can view their company"
ON public.companies
FOR SELECT
USING (
  id IN (SELECT public.get_user_company_id(auth.uid()))
  OR public.is_admin(auth.uid())
);
