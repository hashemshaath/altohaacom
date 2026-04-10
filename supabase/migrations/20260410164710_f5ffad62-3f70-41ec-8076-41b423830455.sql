
-- 1. Profile views: remove owner SELECT, create safe RPC
DROP POLICY IF EXISTS "Profile owners view safe analytics" ON public.profile_views;

CREATE OR REPLACE FUNCTION public.get_my_profile_views(p_limit int DEFAULT 100)
RETURNS TABLE(
  id uuid,
  viewer_user_id uuid,
  created_at timestamptz,
  referrer text,
  country text,
  device_type text,
  browser text,
  viewer_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pv.id, pv.viewer_user_id, pv.created_at, pv.referrer,
         pv.country, pv.device_type, pv.browser, pv.viewer_type
  FROM public.profile_views pv
  WHERE pv.profile_user_id = auth.uid()
  ORDER BY pv.created_at DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile_views(int) FROM anon;

-- 2. Referral clicks: replace user policy with safe RPC
DROP POLICY IF EXISTS "Users can view clicks on their referral codes" ON public.referral_clicks;

CREATE OR REPLACE FUNCTION public.get_my_referral_clicks(p_limit int DEFAULT 200)
RETURNS TABLE(
  id uuid,
  referral_code_id uuid,
  clicked_at timestamptz,
  platform text,
  country text,
  device_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rc.id, rc.referral_code_id, rc.clicked_at, rc.platform, rc.country, rc.device_type
  FROM public.referral_clicks rc
  WHERE rc.referral_code_id IN (
    SELECT rcode.id FROM public.referral_codes rcode WHERE rcode.user_id = auth.uid()
  )
  ORDER BY rc.clicked_at DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_referral_clicks(int) FROM anon;

-- 3. Judge profiles: restrict ALL to super_admin only
DROP POLICY IF EXISTS "Admins can manage all judge profiles" ON public.judge_profiles;

CREATE POLICY "Super admins manage all judge profiles"
ON public.judge_profiles FOR ALL TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Judges can update own profile" ON public.judge_profiles;
CREATE POLICY "Judges can update own profile"
ON public.judge_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Judges can delete own profile" ON public.judge_profiles;
CREATE POLICY "Judges can delete own profile"
ON public.judge_profiles FOR DELETE TO authenticated
USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

-- 4. Company contacts: restrict by role
DROP POLICY IF EXISTS "Users can view their company contacts without tokens" ON public.company_contacts;

CREATE POLICY "Users view own contact record"
ON public.company_contacts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Company managers view company contacts"
ON public.company_contacts FOR SELECT TO authenticated
USING (
  invitation_token IS NULL
  AND company_id IN (
    SELECT cc.company_id FROM public.company_contacts cc
    WHERE cc.user_id = auth.uid() AND cc.role IN ('owner', 'admin', 'manager')
  )
);

CREATE POLICY "Admins view all company contacts"
ON public.company_contacts FOR SELECT TO authenticated
USING (is_admin(auth.uid()));
