
-- 1. Remove SELECT on phone_verifications (OTP codes must not be readable)
DROP POLICY IF EXISTS "Users can view own phone verifications" ON public.phone_verifications;

-- 2. Remove SELECT on email_verifications (verification codes must not be readable)
DROP POLICY IF EXISTS "Users can view own email verifications" ON public.email_verifications;

-- 3. Remove SELECT and DELETE on password_recovery_tokens
DROP POLICY IF EXISTS "Users can view own recovery tokens" ON public.password_recovery_tokens;
DROP POLICY IF EXISTS "Users can delete own recovery tokens" ON public.password_recovery_tokens;

-- 4. Fix profiles: replace broad SELECT with column-restricted function
DROP POLICY IF EXISTS "Users view own or public or admin" ON public.profiles;

-- Owner sees everything
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admin sees everything
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- Create a secure function that returns only safe columns for public profiles
CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'user_id', user_id,
    'full_name', full_name,
    'full_name_ar', full_name_ar,
    'display_name', display_name,
    'display_name_ar', display_name_ar,
    'username', username,
    'avatar_url', avatar_url,
    'cover_image_url', cover_image_url,
    'bio', bio,
    'bio_ar', bio_ar,
    'city', city,
    'country_code', country_code,
    'nationality', nationality,
    'account_type', account_type,
    'specialization', specialization,
    'specialization_ar', specialization_ar,
    'job_title', job_title,
    'job_title_ar', job_title_ar,
    'years_of_experience', years_of_experience,
    'is_verified', is_verified,
    'membership_tier', membership_tier,
    'view_count', view_count,
    'instagram', instagram,
    'twitter', twitter,
    'facebook', facebook,
    'linkedin', linkedin,
    'youtube', youtube,
    'website', website,
    'snapchat', snapchat,
    'tiktok', tiktok,
    'created_at', created_at
  )
  FROM public.profiles
  WHERE lower(username) = lower(p_username)
    AND profile_visibility = 'public'
    AND account_status = 'active'
  LIMIT 1;
$$;

-- Revoke anon access, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.get_public_profile(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO authenticated;

-- Also create a version that looks up by user_id
CREATE OR REPLACE FUNCTION public.get_public_profile_by_id(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'user_id', user_id,
    'full_name', full_name,
    'full_name_ar', full_name_ar,
    'display_name', display_name,
    'display_name_ar', display_name_ar,
    'username', username,
    'avatar_url', avatar_url,
    'cover_image_url', cover_image_url,
    'bio', bio,
    'bio_ar', bio_ar,
    'city', city,
    'country_code', country_code,
    'nationality', nationality,
    'account_type', account_type,
    'specialization', specialization,
    'specialization_ar', specialization_ar,
    'job_title', job_title,
    'job_title_ar', job_title_ar,
    'years_of_experience', years_of_experience,
    'is_verified', is_verified,
    'membership_tier', membership_tier,
    'view_count', view_count,
    'instagram', instagram,
    'twitter', twitter,
    'facebook', facebook,
    'linkedin', linkedin,
    'youtube', youtube,
    'website', website,
    'snapchat', snapchat,
    'tiktok', tiktok,
    'created_at', created_at
  )
  FROM public.profiles
  WHERE user_id = p_user_id
    AND profile_visibility = 'public'
    AND account_status = 'active'
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profile_by_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_id(uuid) TO authenticated;
