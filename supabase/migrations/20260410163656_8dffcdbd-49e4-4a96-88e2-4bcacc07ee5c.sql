
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  user_id, full_name, full_name_ar, display_name, display_name_ar,
  username, avatar_url, cover_image_url,
  bio, bio_ar, city, country_code, nationality,
  account_type, specialization, specialization_ar,
  job_title, job_title_ar, years_of_experience,
  is_verified, verification_level, is_chef_visible,
  profile_visibility, membership_tier, view_count,
  instagram, twitter, facebook, linkedin, youtube, website, snapchat, tiktok,
  created_at
FROM public.profiles
WHERE profile_visibility = 'public' AND account_status = 'active';
