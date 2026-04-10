
-- 1. Secure public view for culinary_entities
DROP VIEW IF EXISTS public.culinary_entities_public;
CREATE VIEW public.culinary_entities_public WITH (security_invoker = on) AS
SELECT
  id, name, name_ar, slug, type, scope, status,
  description, description_ar, mission, mission_ar,
  city, country, address, address_ar, postal_code,
  logo_url, cover_image_url, gallery_urls,
  website, email, phone, fax, social_links,
  specializations, services, tags,
  abbreviation, abbreviation_ar,
  president_name, president_name_ar,
  secretary_name, secretary_name_ar,
  founded_year, member_count, registration_number,
  license_number, license_expires_at,
  is_verified, is_visible, verified_at, verification_level,
  latitude, longitude, username, entity_number,
  view_count, created_at, updated_at, created_by,
  registered_at, affiliated_organizations
FROM public.culinary_entities
WHERE is_visible = true AND status = 'active';

GRANT SELECT ON public.culinary_entities_public TO anon, authenticated;

-- 2. Secure judge view for competition_registrations — no payment columns
DROP VIEW IF EXISTS public.competition_registrations_judge;
CREATE VIEW public.competition_registrations_judge WITH (security_invoker = on) AS
SELECT
  id, competition_id, participant_id, category_id, status,
  team_name, team_name_ar, dish_name, dish_description, dish_image_url,
  entry_type, registration_number, registered_at,
  organization_id, organization_name, organization_name_ar, organization_type,
  notes, approved_at, approved_by
FROM public.competition_registrations;

GRANT SELECT ON public.competition_registrations_judge TO authenticated;
