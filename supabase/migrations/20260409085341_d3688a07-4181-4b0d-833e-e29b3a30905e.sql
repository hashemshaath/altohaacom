-- 1. Create a public-safe view for companies that hides sensitive financial fields
CREATE OR REPLACE VIEW public.companies_public AS
SELECT 
  id, name, name_ar, type, status,
  email, phone, website, address, address_ar,
  city, country, postal_code,
  description, description_ar, logo_url, cover_image_url,
  working_hours, classifications, currency,
  created_at, updated_at, company_number, country_code,
  operating_countries, is_verified, verification_level, verified_at,
  supplier_category, tagline, tagline_ar, founded_year,
  social_links, specializations, is_pro_supplier, featured_order,
  latitude, longitude, neighborhood, neighborhood_ar,
  district, district_ar, google_maps_url,
  national_address, national_address_ar, street, street_ar,
  rating, total_reviews, fax, phone_secondary,
  import_source, supplier_score, total_orders,
  on_time_delivery_rate, response_time_hours,
  building_number, additional_number, unit_number,
  short_address, region, region_ar, floor_number
FROM public.companies
WHERE status = 'active';

-- 2. Fix exhibition_officials: restrict to organizers, admins, or own record
DROP POLICY IF EXISTS "Authenticated can view exhibition officials" ON public.exhibition_officials;

CREATE POLICY "Officials viewable by organizers and admins"
ON public.exhibition_officials
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin(auth.uid())
  OR exhibition_id IN (
    SELECT id FROM public.exhibitions WHERE created_by = auth.uid()
  )
);
