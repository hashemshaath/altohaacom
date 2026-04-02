
-- FIX 2: Remove private messaging tables from Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_ticket_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_session_messages;

-- FIX 3a: Restrict company_employee_invites SELECT
DROP POLICY IF EXISTS "Company members can view employee invites" ON public.company_employee_invites;

CREATE POLICY "Company admins can view employee invites"
ON public.company_employee_invites
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM company_contacts
    WHERE company_contacts.company_id = company_employee_invites.company_id
      AND company_contacts.user_id = auth.uid()
      AND company_contacts.role IN ('owner', 'admin', 'manager')
  ))
  OR is_admin_user()
);

-- FIX 3b: Create safe view for company_contacts (no invitation_token)
CREATE OR REPLACE VIEW public.company_contacts_safe
WITH (security_invoker = true)
AS
SELECT 
  id, company_id, user_id, role, name, name_ar,
  title, title_ar, department,
  email, phone, mobile, whatsapp,
  is_primary, can_login, avatar_url,
  invitation_status, invited_by, invited_at, accepted_at,
  created_at, updated_at
FROM public.company_contacts;

GRANT SELECT ON public.company_contacts_safe TO authenticated;
