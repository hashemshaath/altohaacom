
DROP FUNCTION IF EXISTS public.get_company_sensitive_fields(uuid);

CREATE OR REPLACE FUNCTION public.get_company_sensitive_fields(p_company_id uuid)
RETURNS TABLE(tax_number text, registration_number text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.tax_number, c.registration_number
  FROM public.companies c
  WHERE c.id = p_company_id
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_contacts cc
      WHERE cc.company_id = p_company_id
      AND cc.user_id = auth.uid()
      AND cc.role IN ('owner', 'admin')
    )
  );
$$;
