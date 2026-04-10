
-- 1) company_contacts: hide invitation_token from non-admin company members
-- Revoke column-level SELECT on invitation_token from anon and authenticated
REVOKE SELECT (invitation_token) ON public.company_contacts FROM anon, authenticated;

-- Grant it back only via service_role (used by edge functions)
-- Admin access is already via is_admin() ALL policy which uses service-level

-- 2) companies: hide tax_number and registration_number from public/anon
REVOKE SELECT (tax_number, registration_number) ON public.companies FROM anon;

-- Create a safe RPC for authenticated users who need company details
CREATE OR REPLACE FUNCTION public.get_company_sensitive_fields(p_company_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'tax_number', c.tax_number,
    'registration_number', c.registration_number
  )
  FROM public.companies c
  WHERE c.id = p_company_id
    AND (
      -- Admin or company member
      is_admin(auth.uid())
      OR c.id IN (SELECT get_user_company_id(auth.uid()))
    );
$$;
