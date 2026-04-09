
-- Drop existing view first, then recreate with masked invitation_token
DROP VIEW IF EXISTS public.company_contacts_safe;

CREATE VIEW public.company_contacts_safe
WITH (security_invoker=on) AS
SELECT 
  id, company_id, user_id, role, name, name_ar, title, title_ar,
  email, phone, mobile, whatsapp, department, is_primary, can_login,
  invited_by, invitation_status,
  CASE 
    WHEN is_admin(auth.uid()) THEN invitation_token
    WHEN email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) THEN invitation_token
    ELSE NULL
  END as invitation_token,
  invited_at, accepted_at, created_at, updated_at, avatar_url
FROM company_contacts;
