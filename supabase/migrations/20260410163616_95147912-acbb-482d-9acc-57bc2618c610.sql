
-- 1. Profiles: safe public view
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  user_id, full_name, full_name_ar, username, avatar_url,
  bio, bio_ar, city, country_code,
  account_type, specialization, specialization_ar,
  is_verified, verification_level, is_chef_visible,
  profile_visibility, created_at
FROM public.profiles
WHERE profile_visibility = 'public' AND account_status = 'active';

-- Consolidated SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users view own or admin views all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;

CREATE POLICY "Users view own or public or admin"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR profile_visibility = 'public'
  OR is_admin(auth.uid())
);

-- 2. judge_profiles: remove old public policy
DROP POLICY IF EXISTS "Users can view own judge profile or admins" ON public.judge_profiles;

-- 3. site_settings: restrict categories
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read safe site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated can read safe site settings" ON public.site_settings;

CREATE POLICY "Public can read safe site settings"
ON public.site_settings FOR SELECT TO anon
USING (category IN ('appearance', 'content', 'general', 'layout', 'notifications'));

CREATE POLICY "Authenticated can read site settings"
ON public.site_settings FOR SELECT TO authenticated
USING (category IN ('appearance', 'content', 'general', 'layout', 'notifications') OR is_admin(auth.uid()));
