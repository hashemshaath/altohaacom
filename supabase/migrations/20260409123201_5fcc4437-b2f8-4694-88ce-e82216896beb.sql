-- Fix 1: Recreate companies_public view with security_invoker=on
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker=on) AS
SELECT id,
    name,
    name_ar,
    type,
    status,
    email,
    phone,
    website,
    address,
    address_ar,
    city,
    country,
    postal_code,
    description,
    description_ar,
    logo_url,
    cover_image_url,
    working_hours,
    classifications,
    currency,
    created_at,
    updated_at,
    company_number,
    country_code,
    operating_countries,
    is_verified,
    verification_level,
    verified_at,
    supplier_category,
    tagline,
    tagline_ar,
    founded_year,
    social_links,
    specializations,
    is_pro_supplier,
    featured_order,
    latitude,
    longitude,
    neighborhood,
    neighborhood_ar,
    district,
    district_ar,
    google_maps_url,
    national_address,
    national_address_ar,
    street,
    street_ar,
    rating,
    total_reviews,
    fax,
    phone_secondary,
    import_source,
    supplier_score,
    total_orders,
    on_time_delivery_rate,
    response_time_hours,
    building_number,
    additional_number,
    unit_number,
    short_address,
    region,
    region_ar,
    floor_number
FROM companies
WHERE (status = 'active'::company_status);

-- Fix 2: Recreate profiles_public view with security_invoker=on
-- First get current definition
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
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
    is_open_to_work,
    job_availability_visibility,
    membership_tier,
    membership_status,
    view_count,
    created_at,
    updated_at
FROM profiles
WHERE profile_visibility IS DISTINCT FROM 'private';

-- Fix 3: Tighten membership_gifts UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can redeem pending gifts" ON public.membership_gifts;
CREATE POLICY "Authenticated users can redeem pending gifts"
ON public.membership_gifts
FOR UPDATE
USING (
    auth.uid() IS NOT NULL 
    AND status = 'pending' 
    AND expires_at > now()
    AND (auth.uid() = recipient_id OR auth.uid() = redeemed_by)
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND status IN ('pending', 'redeemed')
    AND (auth.uid() = recipient_id OR auth.uid() = redeemed_by)
);