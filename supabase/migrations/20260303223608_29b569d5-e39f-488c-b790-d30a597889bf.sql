
-- Fix SECURITY DEFINER views by recreating with security_invoker = true
-- This ensures RLS policies of the underlying tables are respected

-- 1. profiles_public
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT 
  id, user_id, full_name, full_name_ar, display_name, display_name_ar,
  avatar_url, cover_image_url, bio, bio_ar, username, account_number,
  account_status, account_type, specialization, specialization_ar,
  experience_level, location, city, country_code, nationality,
  second_nationality, show_nationality, website, instagram, twitter,
  facebook, linkedin, youtube, tiktok, snapchat, whatsapp,
  preferred_language, profile_completed, membership_tier, membership_status,
  membership_expires_at, is_verified, verified_at, verification_level,
  verification_badge, gender, education_level, education_institution,
  years_of_experience, education_entity_id, section_visibility,
  offers_services, services_description, services_description_ar,
  global_awards, profile_visibility, job_title, job_title_ar,
  company_id, company_role, view_count, follow_privacy,
  created_at, updated_at
FROM profiles;

-- 2. competitions_public
DROP VIEW IF EXISTS public.competitions_public;
CREATE VIEW public.competitions_public
WITH (security_invoker = true)
AS SELECT 
  id, competition_number, title, title_ar, description, description_ar,
  status, country_code, city, venue, venue_ar, competition_start,
  competition_end, registration_start, registration_end, max_participants,
  cover_image_url, is_virtual, edition_year, series_id, exhibition_id,
  created_at, updated_at
FROM competitions
WHERE status <> 'draft'::competition_status;

-- 3. judge_profiles_public
DROP VIEW IF EXISTS public.judge_profiles_public;
CREATE VIEW public.judge_profiles_public
WITH (security_invoker = true)
AS SELECT 
  id, user_id, judge_title, judge_title_ar, judge_category, judge_level,
  nationality, country_of_residence, current_position, current_employer,
  years_of_experience, culinary_specialties, certifications,
  languages_spoken, education, education_ar, profile_photo_url, created_at
FROM judge_profiles;

-- 4. fan_leaderboard
DROP VIEW IF EXISTS public.fan_leaderboard;
CREATE VIEW public.fan_leaderboard
WITH (security_invoker = true)
AS SELECT 
  p.user_id, p.full_name, p.username, p.avatar_url, p.account_type,
  COALESCE((SELECT count(*) FROM user_follows uf WHERE uf.follower_id = p.user_id), 0) AS following_count,
  COALESCE((SELECT count(*) FROM fan_favorites ff WHERE ff.user_id = p.user_id), 0) AS favorites_count,
  COALESCE((SELECT count(*) FROM post_comments pc WHERE pc.author_id = p.user_id), 0) AS comments_count,
  COALESCE((SELECT count(*) FROM recipe_reviews rr WHERE rr.user_id = p.user_id), 0) AS reviews_count,
  (
    COALESCE((SELECT count(*) FROM user_follows uf WHERE uf.follower_id = p.user_id), 0) * 2 +
    COALESCE((SELECT count(*) FROM fan_favorites ff WHERE ff.user_id = p.user_id), 0) * 3 +
    COALESCE((SELECT count(*) FROM post_comments pc WHERE pc.author_id = p.user_id), 0) * 5 +
    COALESCE((SELECT count(*) FROM recipe_reviews rr WHERE rr.user_id = p.user_id), 0) * 10
  ) AS engagement_score
FROM profiles p
WHERE p.account_type = 'fan'::account_type
ORDER BY engagement_score DESC;
