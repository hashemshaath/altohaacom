
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe WITH (security_invoker = true) AS
SELECT id, user_id, username, full_name, full_name_ar, display_name, display_name_ar,
  avatar_url, cover_image_url, bio, bio_ar, account_type, account_number,
  city, location, country_code, nationality, profile_visibility, is_verified, is_chef_visible,
  specialization, specialization_ar, years_of_experience,
  instagram, twitter, youtube, tiktok, snapchat, website, facebook, linkedin,
  preferred_language, job_title, job_title_ar, is_open_to_work, job_availability_visibility,
  membership_tier, membership_status, view_count, created_at, updated_at
FROM public.profiles;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = true) AS
SELECT id, user_id, username, full_name, full_name_ar, display_name, display_name_ar,
  avatar_url, cover_image_url, bio, bio_ar, account_type, account_number,
  city, location, country_code, nationality, profile_visibility, is_verified, is_chef_visible,
  specialization, specialization_ar, years_of_experience,
  instagram, twitter, youtube, tiktok, snapchat, website, facebook, linkedin,
  preferred_language, job_title, job_title_ar, membership_tier, membership_status, view_count, created_at
FROM public.profiles WHERE profile_visibility IS DISTINCT FROM 'private';

DROP VIEW IF EXISTS public.fan_leaderboard;
CREATE VIEW public.fan_leaderboard WITH (security_invoker = true) AS
SELECT p.user_id, p.username, p.full_name, p.avatar_url,
  COALESCE(likes.cnt, 0) AS total_likes,
  COALESCE(comments.cnt, 0) AS total_comments,
  COALESCE(saves.cnt, 0) AS total_saves,
  (COALESCE(likes.cnt, 0) + COALESCE(comments.cnt, 0) * 2 + COALESCE(saves.cnt, 0) * 3) AS engagement_score
FROM public.profiles p
LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM public.post_likes GROUP BY user_id) likes ON likes.user_id = p.user_id
LEFT JOIN (SELECT author_id, COUNT(*) AS cnt FROM public.post_comments GROUP BY author_id) comments ON comments.author_id = p.user_id
LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM public.recipe_saves GROUP BY user_id) saves ON saves.user_id = p.user_id
WHERE p.profile_visibility IS DISTINCT FROM 'private'
ORDER BY engagement_score DESC;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.ad_campaigns; EXCEPTION WHEN OTHERS THEN NULL; END;
END; $$;
