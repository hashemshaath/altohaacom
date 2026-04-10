
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  user_id, full_name, full_name_ar, display_name, display_name_ar,
  username, account_number, avatar_url, cover_image_url,
  bio, bio_ar, city, country_code, location,
  account_type, specialization, specialization_ar,
  job_title, job_title_ar,
  nationality, show_nationality, membership_tier,
  is_verified, verification_level, verification_badge, is_chef_visible,
  profile_visibility, follow_privacy,
  facebook, instagram, twitter, linkedin, youtube, tiktok, snapchat, website,
  years_of_experience, experience_level, interests, favorite_cuisines,
  created_at, view_count
FROM public.profiles
WHERE profile_visibility = 'public' AND account_status = 'active';

GRANT SELECT ON public.profiles_public TO anon, authenticated;
