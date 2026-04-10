
-- 1. company_role_assignments: drop ALL existing SELECT policies and create scoped one
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'company_role_assignments' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.company_role_assignments', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Company members can view role assignments"
ON public.company_role_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_contacts cc
    WHERE cc.company_id = company_role_assignments.company_id
    AND cc.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- 2. entity_positions: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view entity positions" ON public.entity_positions;

CREATE POLICY "Authenticated can view entity positions"
ON public.entity_positions FOR SELECT TO authenticated
USING (true);

-- 3. email_verifications: ensure NO SELECT policies remain
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'email_verifications' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_verifications', pol.policyname);
  END LOOP;
END $$;

-- 4. company_contacts: update own-record policy to exclude invitation_token
DROP POLICY IF EXISTS "Users view own contact record" ON public.company_contacts;

CREATE POLICY "Users view own contact record"
ON public.company_contacts FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  AND invitation_token IS NULL
);
