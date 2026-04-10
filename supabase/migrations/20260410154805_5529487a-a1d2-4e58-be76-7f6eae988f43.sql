
-- 1. Companies: remove direct anon policy
DROP POLICY IF EXISTS "Anon view active companies safe" ON public.companies;
GRANT SELECT ON public.companies_public_safe TO anon;

-- 2. Block SELECT on verification tables
DROP POLICY IF EXISTS "Users can view own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can read own verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can view own phone verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can read own verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can view own recovery tokens" ON public.password_recovery_tokens;
DROP POLICY IF EXISTS "Users can read own tokens" ON public.password_recovery_tokens;

-- 3. Judge profiles: safe view excluding sensitive PII
DROP VIEW IF EXISTS public.judge_profiles_safe;
CREATE VIEW public.judge_profiles_safe
WITH (security_invoker = on) AS
SELECT
  id, user_id, judge_title, judge_title_ar,
  judge_category, judge_level, nationality,
  country_of_residence, current_position, current_employer,
  years_of_experience, culinary_specialties, certifications,
  languages_spoken, education, education_ar,
  profile_photo_url, created_at, updated_at
FROM public.judge_profiles;
