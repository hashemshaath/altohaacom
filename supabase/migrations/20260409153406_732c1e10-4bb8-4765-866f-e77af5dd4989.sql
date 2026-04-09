
-- Fix 1: Restrict exhibition_booths contact data to authenticated users
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'exhibition_booths' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.exhibition_booths', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view booths"
  ON public.exhibition_booths FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Restrict permissions table
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'permissions' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.permissions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- Fix 3: Restrict role_permissions table
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'role_permissions' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.role_permissions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Fix 4: Restrict company_role_assignments
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'company_role_assignments' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.company_role_assignments', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view company role assignments"
  ON public.company_role_assignments FOR SELECT
  TO authenticated
  USING (true);

-- Fix 5: Realtime channel authorization
CREATE POLICY "Authenticated users can access realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (true);
