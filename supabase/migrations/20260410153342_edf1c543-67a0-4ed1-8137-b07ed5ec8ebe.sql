
-- 1. chefs_table_sessions: safe view
DROP POLICY IF EXISTS "Public can view published sessions" ON public.chefs_table_sessions;
DROP POLICY IF EXISTS "Anyone can view published sessions" ON public.chefs_table_sessions;
DROP POLICY IF EXISTS "Published sessions are publicly visible" ON public.chefs_table_sessions;

DROP VIEW IF EXISTS public.chefs_table_sessions_public;
CREATE VIEW public.chefs_table_sessions_public
WITH (security_invoker = on) AS
SELECT id, title, title_ar, description, description_ar,
  product_name, product_name_ar, product_category, experience_type,
  venue, venue_ar, city, country_code, session_date, session_end,
  cover_image_url, status, is_published, organizer_id,
  chef_selection_method, max_chefs, published_at, created_at
FROM public.chefs_table_sessions
WHERE is_published = true AND status IN ('upcoming', 'confirmed', 'completed');

-- 2. tasting_sessions
DROP POLICY IF EXISTS "Anyone can view tasting sessions" ON public.tasting_sessions;
DROP POLICY IF EXISTS "Public can view tasting sessions" ON public.tasting_sessions;
DROP POLICY IF EXISTS "Public can view completed tasting sessions" ON public.tasting_sessions;
DROP POLICY IF EXISTS "Authenticated can view tasting sessions" ON public.tasting_sessions;
DROP POLICY IF EXISTS "Anon can view completed tasting sessions" ON public.tasting_sessions;

CREATE POLICY "Authenticated can view tasting sessions"
ON public.tasting_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view completed tasting sessions"
ON public.tasting_sessions FOR SELECT TO anon USING (status = 'completed');

-- 3. exhibition_booths
DROP POLICY IF EXISTS "Authenticated can view booths" ON public.exhibition_booths;
DROP POLICY IF EXISTS "Anyone can view exhibition booths" ON public.exhibition_booths;
DROP POLICY IF EXISTS "Authenticated users can view booths" ON public.exhibition_booths;
DROP POLICY IF EXISTS "Booth contact visible to organizer or admin" ON public.exhibition_booths;
DROP POLICY IF EXISTS "Booth visible to organizer assignee or admin" ON public.exhibition_booths;

DROP VIEW IF EXISTS public.exhibition_booths_public;
CREATE VIEW public.exhibition_booths_public
WITH (security_invoker = on) AS
SELECT id, exhibition_id, booth_number, name, name_ar, description, description_ar,
  category, company_id, logo_url, location_x, location_y, hall, hall_ar,
  floor_level, size, is_featured, website_url, status, price, currency,
  color_hex, size_sqm, booking_status, created_at, updated_at
FROM public.exhibition_booths;

CREATE POLICY "Booth visible to organizer assignee or admin"
ON public.exhibition_booths FOR SELECT TO authenticated
USING (
  assigned_to = auth.uid()
  OR booked_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exhibitions e WHERE e.id = exhibition_booths.exhibition_id AND e.organizer_id = auth.uid())
  OR public.is_admin(auth.uid())
);
