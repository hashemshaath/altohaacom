
-- COMPANY CONTACTS: secure view without invitation_token
DROP VIEW IF EXISTS public.company_contacts_safe;
CREATE VIEW public.company_contacts_safe WITH (security_invoker = on) AS
SELECT
  id, company_id, user_id, role, department, name, name_ar,
  title, title_ar, email, phone, mobile, whatsapp,
  avatar_url, is_primary, invitation_status, invited_at, invited_by,
  accepted_at, can_login, created_at, updated_at
FROM public.company_contacts;

GRANT SELECT ON public.company_contacts_safe TO authenticated;
