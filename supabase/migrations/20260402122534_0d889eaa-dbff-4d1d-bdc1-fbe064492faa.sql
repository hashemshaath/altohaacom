
-- 1. Fix is_admin: supervisor + organizer only
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id 
    AND role IN ('supervisor', 'organizer')
  );
$$;

-- 2. Fix is_admin_user: supervisor + organizer only
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('supervisor', 'organizer')
  );
$$;

-- 3. Fix profiles PII — remove duplicate/redundant SELECT policies
DROP POLICY IF EXISTS "Anonymous users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 4. Fix exhibition_sponsor_applications — scope to company contact or admin
DROP POLICY IF EXISTS "Users see own applications" ON public.exhibition_sponsor_applications;

CREATE POLICY "Users see own applications"
  ON public.exhibition_sponsor_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts cc
      WHERE cc.company_id = exhibition_sponsor_applications.company_id
        AND cc.user_id = auth.uid()
    )
    OR is_admin_user()
  );
