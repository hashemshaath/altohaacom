-- Fix company_registration_requests INSERT: enforce submitted_by = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create company registration" ON public.company_registration_requests;
CREATE POLICY "Authenticated users can create company registration" ON public.company_registration_requests
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Fix company_drivers SELECT: restrict to company managers/owners only
DROP POLICY IF EXISTS "Company users can view drivers" ON public.company_drivers;
CREATE POLICY "Company managers can view drivers" ON public.company_drivers
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts cc
      WHERE cc.company_id = company_drivers.company_id
        AND cc.user_id = auth.uid()
        AND cc.role IN ('owner', 'manager', 'admin')
    )
    OR public.is_admin(auth.uid())
  );