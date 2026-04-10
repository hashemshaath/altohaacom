
-- Policies already created in previous partial migration
-- Now just create the safe view with correct columns
CREATE OR REPLACE VIEW public.chefs_table_sessions_public AS
SELECT
  id, title, title_ar, description, description_ar,
  session_date, session_end, session_number,
  venue, venue_ar, city, country_code,
  product_name, product_name_ar, product_category,
  experience_type, chef_selection_method,
  max_chefs, cover_image_url,
  status, is_published, published_at,
  report_published, report_published_at,
  organizer_id, company_id,
  created_at, updated_at
FROM public.chefs_table_sessions
WHERE is_published = true;

ALTER VIEW public.chefs_table_sessions_public SET (security_invoker = on);
GRANT SELECT ON public.chefs_table_sessions_public TO anon, authenticated;
