
-- Drop existing function with old parameter name
DROP FUNCTION IF EXISTS public.get_company_invitation_token(uuid);

-- Recreate with correct parameter name
CREATE OR REPLACE FUNCTION public.get_company_invitation_token(p_company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT invitation_token
  FROM public.company_contacts
  WHERE company_id = p_company_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  LIMIT 1;
$$;
