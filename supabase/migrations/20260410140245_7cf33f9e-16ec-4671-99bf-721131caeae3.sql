
-- 1) tasting_sessions: fix with correct enum values
-- Previous migration already dropped old policies, now recreate properly
DROP POLICY IF EXISTS "Users can view relevant tasting sessions" ON public.tasting_sessions;
DROP POLICY IF EXISTS "Public can view published tasting sessions" ON public.tasting_sessions;

CREATE POLICY "Users can view relevant tasting sessions"
ON public.tasting_sessions FOR SELECT TO authenticated
USING (
  organizer_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tasting_scores ts
    WHERE ts.session_id = tasting_sessions.id
    AND ts.judge_id = auth.uid()
  )
  OR status IN ('open', 'in_progress', 'completed')
);

CREATE POLICY "Public can view completed tasting sessions"
ON public.tasting_sessions FOR SELECT TO anon
USING (status = 'completed');

-- 2) judge_profiles: already dropped "Judges can manage own profile"
-- Now create granular policies
DROP POLICY IF EXISTS "Judges can view own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can insert own profile" ON public.judge_profiles;
DROP POLICY IF EXISTS "Judges can update own profile" ON public.judge_profiles;

CREATE POLICY "Judges can view own profile"
ON public.judge_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Judges can insert own profile"
ON public.judge_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Judges can update own profile"
ON public.judge_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (
  user_id = auth.uid()
  AND internal_notes IS NOT DISTINCT FROM (
    SELECT jp.internal_notes FROM public.judge_profiles jp WHERE jp.id = judge_profiles.id
  )
);

-- Safe view excluding internal_notes
CREATE OR REPLACE VIEW public.judge_profiles_safe AS
SELECT
  id, user_id, full_name_ar, gender, nationality, second_nationality,
  country_of_residence, date_of_birth, marital_status,
  languages_spoken, culinary_specialties, certifications,
  years_of_experience, education, education_ar,
  current_employer, current_position,
  judge_category, judge_level, judge_title, judge_title_ar,
  notes, allergies, blood_type, dietary_restrictions,
  medical_notes, emergency_contact_name, emergency_contact_phone,
  national_id, passport_number, passport_country,
  passport_issue_date, passport_expiry_date,
  shirt_size, preferred_airline, frequent_flyer_number,
  travel_notes, spouse_name, spouse_name_ar, spouse_phone,
  profile_photo_url, resume_url,
  created_at, updated_at
FROM public.judge_profiles;

ALTER VIEW public.judge_profiles_safe SET (security_invoker = on);
GRANT SELECT ON public.judge_profiles_safe TO authenticated;
