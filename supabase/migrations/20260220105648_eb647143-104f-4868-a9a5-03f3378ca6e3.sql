
-- ============================================================
-- FIX 3: WARN - Create safe public view for competitions
-- ============================================================

CREATE OR REPLACE VIEW public.competitions_public
WITH (security_invoker = true)
AS
SELECT
  id, competition_number, title, title_ar, description, description_ar,
  status, country_code, city, venue, venue_ar,
  competition_start, competition_end, registration_start, registration_end,
  max_participants, cover_image_url,
  is_virtual, edition_year, series_id,
  exhibition_id, created_at, updated_at
FROM public.competitions
WHERE status != 'draft';
