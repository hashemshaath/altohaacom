
-- 1) phone_verifications: require user_id = auth.uid() always
DROP POLICY IF EXISTS "Users can create own phone verification" ON public.phone_verifications;
CREATE POLICY "Users can create own phone verification"
ON public.phone_verifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2) password_recovery_tokens: remove SELECT (tokens should only be validated server-side)
DROP POLICY IF EXISTS "Users can view own recovery tokens" ON public.password_recovery_tokens;

-- 3) profiles: protect email and secondary_email from arbitrary changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid())
  AND secondary_email IS NOT DISTINCT FROM (SELECT p.secondary_email FROM public.profiles p WHERE p.user_id = auth.uid())
  AND account_type IS NOT DISTINCT FROM (SELECT p.account_type FROM public.profiles p WHERE p.user_id = auth.uid())
  AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND company_role IS NOT DISTINCT FROM (SELECT p.company_role FROM public.profiles p WHERE p.user_id = auth.uid())
  AND suspended_at IS NOT DISTINCT FROM (SELECT p.suspended_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND suspended_reason IS NOT DISTINCT FROM (SELECT p.suspended_reason FROM public.profiles p WHERE p.user_id = auth.uid())
  AND wallet_balance IS NOT DISTINCT FROM (SELECT p.wallet_balance FROM public.profiles p WHERE p.user_id = auth.uid())
  AND membership_tier IS NOT DISTINCT FROM (SELECT p.membership_tier FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND account_status IS NOT DISTINCT FROM (SELECT p.account_status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND loyalty_points IS NOT DISTINCT FROM (SELECT p.loyalty_points FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verification_level IS NOT DISTINCT FROM (SELECT p.verification_level FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verification_badge IS NOT DISTINCT FROM (SELECT p.verification_badge FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verified_at IS NOT DISTINCT FROM (SELECT p.verified_at FROM public.profiles p WHERE p.user_id = auth.uid())
  AND email_verified IS NOT DISTINCT FROM (SELECT p.email_verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND phone_verified IS NOT DISTINCT FROM (SELECT p.phone_verified FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 4) ad_clicks: remove old anon INSERT policy
DROP POLICY IF EXISTS "Anyone can insert clicks with session" ON public.ad_clicks;
CREATE POLICY "Authenticated users can insert clicks"
ON public.ad_clicks FOR INSERT TO authenticated
WITH CHECK (session_id IS NOT NULL AND creative_id IS NOT NULL);

-- 5) ad_impressions: remove old anon INSERT policy
DROP POLICY IF EXISTS "Anyone can insert impressions with session" ON public.ad_impressions;
CREATE POLICY "Authenticated users can insert impressions"
ON public.ad_impressions FOR INSERT TO authenticated
WITH CHECK (session_id IS NOT NULL AND creative_id IS NOT NULL);
