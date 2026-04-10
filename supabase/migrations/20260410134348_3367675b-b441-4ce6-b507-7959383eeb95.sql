
-- 1) Chef schedule events: safe public view
DROP POLICY IF EXISTS "Public can view public schedule events" ON public.chef_schedule_events;

CREATE OR REPLACE VIEW public.chef_schedule_events_public AS
SELECT
  id, chef_id, title, title_ar, description, description_ar,
  event_type, start_date, end_date, all_day,
  location, location_ar, venue, venue_ar, city, country_code,
  visibility, status, priority, color,
  organizer, organizer_ar, program_name, program_name_ar,
  participation_type, participation_type_ar,
  channel_name, channel_name_ar, broadcast_type,
  tags, media_url, show_details_publicly,
  created_at, updated_at
FROM public.chef_schedule_events
WHERE visibility = 'public' AND status != 'cancelled';

ALTER VIEW public.chef_schedule_events_public SET (security_invoker = on);
GRANT SELECT ON public.chef_schedule_events_public TO anon, authenticated;

CREATE POLICY "Public can view public schedule events"
ON public.chef_schedule_events FOR SELECT TO anon
USING (visibility = 'public' AND status != 'cancelled');

DROP POLICY IF EXISTS "Users can view own schedule events" ON public.chef_schedule_events;
CREATE POLICY "Users can view own or public schedule events"
ON public.chef_schedule_events FOR SELECT TO authenticated
USING (
  chef_id = auth.uid()
  OR visibility = 'public'
  OR public.is_admin(auth.uid())
);

-- 2) SEO tables: admin only
DROP POLICY IF EXISTS "Anyone can view AI models" ON public.seo_ai_models;
DROP POLICY IF EXISTS "Public can view AI models" ON public.seo_ai_models;
CREATE POLICY "Admins can view AI models"
ON public.seo_ai_models FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view SEO rules" ON public.seo_rules;
DROP POLICY IF EXISTS "Public can view SEO rules" ON public.seo_rules;
CREATE POLICY "Admins can view SEO rules"
ON public.seo_rules FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view translatable fields" ON public.seo_translatable_fields;
DROP POLICY IF EXISTS "Public can view translatable fields" ON public.seo_translatable_fields;
CREATE POLICY "Admins can view translatable fields"
ON public.seo_translatable_fields FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view content sources" ON public.seo_content_sources;
DROP POLICY IF EXISTS "Public can view content sources" ON public.seo_content_sources;
CREATE POLICY "Admins can view content sources"
ON public.seo_content_sources FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- 3) Realtime: remove blanket public topic
DROP POLICY IF EXISTS "Users can access their own realtime channels" ON realtime.messages;
