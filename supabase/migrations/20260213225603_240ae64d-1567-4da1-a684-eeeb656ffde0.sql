
-- Fix judge_profiles: restrict SELECT to only the judge themselves + admins
DROP POLICY IF EXISTS "Authenticated can view judge profiles" ON public.judge_profiles;

CREATE POLICY "Users can view own judge profile or admins"
ON public.judge_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
);

-- Create a safe public view for judge listing (no passport, medical, or personal data)
CREATE OR REPLACE VIEW public.judge_profiles_public AS
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
