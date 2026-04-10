
-- Fix company_contacts: restrict invitation_token visibility
DROP POLICY IF EXISTS "Users can view their company contacts" ON public.company_contacts;

CREATE POLICY "Users can view their company contacts without tokens"
ON public.company_contacts
FOR SELECT TO authenticated
USING (
  -- Own record: full access
  (user_id = auth.uid())
  OR
  -- Same company but not own: allowed (token hidden via app-level safe function)
  (company_id IN (
    SELECT cc.company_id FROM company_contacts cc WHERE cc.user_id = auth.uid()
  ) AND invitation_token IS NULL)
);

-- Fix chef_establishment_qualifications: require authentication
DROP POLICY IF EXISTS "Anyone can view qualifications" ON public.chef_establishment_qualifications;

CREATE POLICY "Authenticated users can view qualifications"
ON public.chef_establishment_qualifications
FOR SELECT TO authenticated
USING (true);
