
-- Create a dedicated employee invitations table with a unique name
CREATE TABLE IF NOT EXISTS public.company_employee_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role company_contact_role DEFAULT 'viewer',
  invited_by uuid NOT NULL,
  token text NOT NULL DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 12)),
  status text NOT NULL DEFAULT 'pending',
  message text,
  message_ar text,
  department text,
  title text,
  title_ar text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + INTERVAL '7 days',
  accepted_at timestamptz,
  accepted_by uuid
);

ALTER TABLE public.company_employee_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view employee invites"
  ON public.company_employee_invites FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.company_contacts WHERE user_id = auth.uid())
    OR public.is_admin_user()
  );

CREATE POLICY "Company admins can create employee invites"
  ON public.company_employee_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_contacts
      WHERE company_id = company_employee_invites.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
    OR public.is_admin_user()
  );

CREATE POLICY "Company admins can update employee invites"
  ON public.company_employee_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts
      WHERE company_id = company_employee_invites.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
    OR public.is_admin_user()
  );

CREATE POLICY "Company admins can delete employee invites"
  ON public.company_employee_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts
      WHERE company_id = company_employee_invites.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR public.is_admin_user()
  );
