
-- Create safe function to get invitation token (admin/owner only)
CREATE OR REPLACE FUNCTION public.get_company_invitation_token(p_contact_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cc.invitation_token
  FROM public.company_contacts cc
  WHERE cc.id = p_contact_id
    AND EXISTS (
      SELECT 1 FROM public.company_contacts caller
      WHERE caller.company_id = cc.company_id
        AND caller.user_id = auth.uid()
        AND caller.role IN ('owner', 'admin')
    )
  LIMIT 1;
$$;
