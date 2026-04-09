-- Recreate profiles_safe view excluding sensitive financial/personal columns
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe AS
SELECT
  user_id,
  full_name,
  full_name_ar,
  username,
  display_name,
  display_name_ar,
  avatar_url,
  cover_image_url,
  bio,
  bio_ar,
  city,
  nationality,
  country_code,
  profile_visibility,
  section_visibility,
  specialization,
  specialization_ar,
  is_verified,
  account_number,
  created_at,
  job_title,
  job_title_ar,
  years_of_experience,
  preferred_language,
  website,
  show_nationality,
  is_chef_visible,
  view_count,
  offers_services,
  services_description,
  services_description_ar,
  is_open_to_work,
  interests,
  favorite_cuisines
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO anon, authenticated;