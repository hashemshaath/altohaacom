
-- Fix the security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.judge_profiles_public;

CREATE VIEW public.judge_profiles_public
WITH (security_invoker = true)
AS
SELECT 
  jp.id,
  jp.user_id,
  jp.judge_title,
  jp.judge_title_ar,
  jp.judge_category,
  jp.judge_level,
  jp.nationality,
  jp.country_of_residence,
  jp.current_position,
  jp.current_employer,
  jp.years_of_experience,
  jp.culinary_specialties,
  jp.certifications,
  jp.languages_spoken,
  jp.education,
  jp.education_ar,
  jp.profile_photo_url,
  jp.created_at
FROM public.judge_profiles jp;

GRANT SELECT ON public.judge_profiles_public TO authenticated;
GRANT SELECT ON public.judge_profiles_public TO anon;
