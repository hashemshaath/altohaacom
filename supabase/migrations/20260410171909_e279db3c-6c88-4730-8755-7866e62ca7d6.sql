-- Create a secure public view for culinary_entities excluding internal_notes and account_manager_id
CREATE OR REPLACE VIEW public.culinary_entities_public
WITH (security_invoker = on)
AS SELECT
  id, entity_number, username, slug, name, name_ar,
  abbreviation, abbreviation_ar, description, description_ar,
  type, scope, status, is_visible, is_verified,
  country, city, address, address_ar, postal_code,
  email, phone, fax, website, social_links,
  logo_url, cover_image_url, gallery_urls,
  president_name, president_name_ar,
  secretary_name, secretary_name_ar,
  founded_year, member_count,
  mission, mission_ar, services, specializations,
  affiliated_organizations, tags,
  registration_number, license_number,
  registered_at, license_expires_at,
  view_count, created_by, created_at, updated_at,
  verification_level, verified_at,
  latitude, longitude
FROM public.culinary_entities;

GRANT SELECT ON public.culinary_entities_public TO anon, authenticated;