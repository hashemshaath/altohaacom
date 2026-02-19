
-- Create a public view of profiles that excludes PII columns
-- This view runs as the view owner (bypasses RLS on base table)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id, user_id, full_name, full_name_ar, display_name, display_name_ar,
  avatar_url, cover_image_url, bio, bio_ar,
  username, account_number, account_status,
  specialization, specialization_ar, experience_level,
  location, city, country_code, nationality, second_nationality, show_nationality,
  website, instagram, twitter, facebook, linkedin, youtube, tiktok, snapchat,
  preferred_language, profile_completed,
  membership_tier, membership_status, membership_expires_at,
  is_verified, verified_at, verification_level, verification_badge,
  gender, education_level, education_institution, years_of_experience,
  education_entity_id, section_visibility,
  offers_services, services_description, services_description_ar,
  global_awards, profile_visibility,
  job_title, job_title_ar,
  company_id, company_role,
  view_count, follow_privacy,
  created_at, updated_at
FROM public.profiles;

-- Grant access to the view for all roles
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Now tighten the base profiles table RLS:
-- Drop existing permissive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous can view public profile data" ON public.profiles;

-- Create owner-only SELECT policy
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create admin SELECT policy (admins can view all profiles with full PII)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin_user());
