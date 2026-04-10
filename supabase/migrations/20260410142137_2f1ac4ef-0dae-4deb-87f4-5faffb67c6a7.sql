
-- 1) judge_profiles: remove conflicting ALL policy
DROP POLICY IF EXISTS "Judges can manage own profile" ON public.judge_profiles;

-- Add DELETE policy since ALL was removed
DROP POLICY IF EXISTS "Judges can delete own profile" ON public.judge_profiles;
CREATE POLICY "Judges can delete own profile"
ON public.judge_profiles FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 2) companies: restrict anon SELECT
DROP POLICY IF EXISTS "Public can view active companies" ON public.companies;
CREATE POLICY "Public can view active companies"
ON public.companies FOR SELECT TO anon
USING (status = 'active');
