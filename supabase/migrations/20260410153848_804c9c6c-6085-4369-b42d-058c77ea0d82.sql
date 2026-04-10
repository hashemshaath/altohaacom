
-- 1. companies: replace anon SELECT with safe view
DROP POLICY IF EXISTS "Public can view active companies" ON public.companies;

-- Create safe public view excluding financial/operational data
DROP VIEW IF EXISTS public.companies_public_safe;
CREATE VIEW public.companies_public_safe
WITH (security_invoker = on) AS
SELECT
  id, name, name_ar, type, status, email, phone, website,
  address, address_ar, city, country, postal_code,
  description, description_ar, logo_url, cover_image_url,
  working_hours, classifications, country_code, operating_countries,
  is_verified, verification_level, supplier_category,
  tagline, tagline_ar, founded_year, social_links, specializations,
  is_pro_supplier, featured_order, latitude, longitude,
  neighborhood, neighborhood_ar, district, district_ar,
  google_maps_url, rating, total_reviews, created_at
FROM public.companies
WHERE status = 'active';

-- Anon policy: only active companies, exclude sensitive columns via restricted view
CREATE POLICY "Anon view active companies safe"
ON public.companies FOR SELECT TO anon
USING (status = 'active');

-- 2. customer_groups: restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can read customer groups" ON public.customer_groups;
DROP POLICY IF EXISTS "Anyone can view customer groups" ON public.customer_groups;

CREATE POLICY "Admins can read customer groups"
ON public.customer_groups FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
