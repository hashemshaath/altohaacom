-- Recreate profiles_public view WITHOUT security_invoker
-- so it can read all non-private profiles regardless of RLS
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT id,
    user_id,
    username,
    full_name,
    full_name_ar,
    display_name,
    display_name_ar,
    avatar_url,
    cover_image_url,
    bio,
    bio_ar,
    account_type,
    account_number,
    city,
    location,
    country_code,
    nationality,
    profile_visibility,
    is_verified,
    is_chef_visible,
    specialization,
    specialization_ar,
    years_of_experience,
    instagram,
    twitter,
    youtube,
    tiktok,
    snapchat,
    website,
    facebook,
    linkedin,
    preferred_language,
    job_title,
    job_title_ar,
    membership_tier,
    membership_status,
    view_count,
    created_at
  FROM profiles
  WHERE profile_visibility IS DISTINCT FROM 'private';

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;