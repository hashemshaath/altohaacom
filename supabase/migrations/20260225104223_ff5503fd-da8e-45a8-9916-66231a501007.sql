
-- ============================================================
-- FIX 1: Remove overly permissive profiles SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view non-sensitive profile data" ON public.profiles;

-- ============================================================
-- FIX 2: Drop dependent policies, recreate views with SECURITY INVOKER
-- ============================================================

-- Drop dependent policy first
DROP POLICY IF EXISTS "Public can view career records for public profiles" ON public.user_career_records;

-- Recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT 
    id, user_id, full_name, full_name_ar, display_name, display_name_ar,
    avatar_url, cover_image_url, bio, bio_ar, username, account_number,
    account_status, specialization, specialization_ar, experience_level,
    location, city, country_code, nationality, second_nationality, show_nationality,
    website, instagram, twitter, facebook, linkedin, youtube, tiktok, snapchat, whatsapp,
    preferred_language, profile_completed, membership_tier, membership_status,
    membership_expires_at, is_verified, verified_at, verification_level, verification_badge,
    gender, education_level, education_institution, years_of_experience, education_entity_id,
    section_visibility, offers_services, services_description, services_description_ar,
    global_awards, profile_visibility, job_title, job_title_ar, company_id, company_role,
    view_count, follow_privacy, created_at, updated_at
FROM public.profiles;

DROP VIEW IF EXISTS public.judge_profiles_public CASCADE;
CREATE VIEW public.judge_profiles_public
WITH (security_invoker = true)
AS SELECT 
    id, user_id, judge_title, judge_title_ar, judge_category, judge_level,
    nationality, country_of_residence, current_position, current_employer,
    years_of_experience, culinary_specialties, certifications, languages_spoken,
    education, education_ar, profile_photo_url, created_at
FROM public.judge_profiles;

DROP VIEW IF EXISTS public.competitions_public CASCADE;
CREATE VIEW public.competitions_public
WITH (security_invoker = true)
AS SELECT 
    id, competition_number, title, title_ar, description, description_ar,
    status, country_code, city, venue, venue_ar,
    competition_start, competition_end, registration_start, registration_end,
    max_participants, cover_image_url, is_virtual, edition_year,
    series_id, exhibition_id, created_at, updated_at
FROM public.competitions
WHERE status <> 'draft';

-- ============================================================
-- Recreate the dependent career records policy using profiles table directly
-- ============================================================
CREATE POLICY "Public can view career records for public profiles"
ON public.user_career_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_career_records.user_id
    AND p.profile_visibility <> 'private'
  )
);
