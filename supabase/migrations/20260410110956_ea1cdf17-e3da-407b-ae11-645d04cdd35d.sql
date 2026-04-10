
-- 1) Profiles: protect account_type, company_id, company_role, suspended_at, suspended_reason
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
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

-- 2) SEO tables: remove organizer access, supervisor only
DROP POLICY IF EXISTS "Admin or organizer manage SEO models" ON public.seo_ai_models;
DROP POLICY IF EXISTS "Admins manage SEO models" ON public.seo_ai_models;
CREATE POLICY "Supervisors manage SEO models"
ON public.seo_ai_models FOR ALL TO authenticated
USING (has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'supervisor'::app_role));

DROP POLICY IF EXISTS "Admin or organizer manage SEO rules" ON public.seo_rules;
DROP POLICY IF EXISTS "Admins manage SEO rules" ON public.seo_rules;
CREATE POLICY "Supervisors manage SEO rules"
ON public.seo_rules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'supervisor'::app_role));

DROP POLICY IF EXISTS "Admin or organizer manage translatable fields" ON public.seo_translatable_fields;
DROP POLICY IF EXISTS "Admins manage translatable fields" ON public.seo_translatable_fields;
CREATE POLICY "Supervisors manage translatable fields"
ON public.seo_translatable_fields FOR ALL TO authenticated
USING (has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'supervisor'::app_role));

DROP POLICY IF EXISTS "Admin or organizer manage content sources" ON public.seo_content_sources;
DROP POLICY IF EXISTS "Admins manage content sources" ON public.seo_content_sources;
CREATE POLICY "Supervisors manage content sources"
ON public.seo_content_sources FOR ALL TO authenticated
USING (has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'supervisor'::app_role));
