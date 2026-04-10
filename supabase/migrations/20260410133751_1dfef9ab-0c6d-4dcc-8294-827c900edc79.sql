
-- 1) Remove weak duplicate email_verifications INSERT policy
DROP POLICY IF EXISTS "Users can insert own email verifications" ON public.email_verifications;

-- 2) Harden phone_verifications INSERT: validate phone ownership
DROP POLICY IF EXISTS "Users can insert own phone verifications" ON public.phone_verifications;
CREATE POLICY "Users can insert own phone verifications"
ON public.phone_verifications FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND phone_number = (
    SELECT p.phone FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- 3) Create safe public view for companies excluding sensitive columns
CREATE OR REPLACE VIEW public.companies_public_safe AS
SELECT
  id, name, name_ar, logo_url, cover_image_url,
  description, description_ar, type, status,
  city, country, country_code, address, address_ar,
  district, district_ar, region, region_ar,
  neighborhood, neighborhood_ar, street, street_ar,
  website, email, phone, social_links,
  is_verified, verified_at, verification_level,
  founded_year, specializations, classifications,
  operating_countries, supplier_category,
  rating, total_reviews, total_orders,
  supplier_score, on_time_delivery_rate, response_time_hours,
  is_pro_supplier, featured_order, working_hours,
  tagline, tagline_ar, currency,
  google_maps_url, latitude, longitude,
  national_address, national_address_ar, short_address,
  postal_code, building_number, additional_number,
  floor_number, unit_number,
  created_at, updated_at, created_by
FROM public.companies
WHERE status = 'active';

GRANT SELECT ON public.companies_public_safe TO anon, authenticated;
