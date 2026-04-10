
-- chef_schedule_events: safe view excluding internal_notes, fees, contract details
DROP VIEW IF EXISTS public.chef_schedule_events_public;
CREATE VIEW public.chef_schedule_events_public
WITH (security_invoker = on) AS
SELECT id, chef_id, event_type, title, title_ar, description, description_ar,
  start_date, end_date, all_day, timezone, location, location_ar,
  city, country_code, venue, venue_ar, visibility, status, priority, color,
  created_at, updated_at
FROM public.chef_schedule_events
WHERE visibility = 'public' AND status != 'cancelled';

DROP POLICY IF EXISTS "Public can view public schedule events" ON public.chef_schedule_events;
GRANT SELECT ON public.chef_schedule_events_public TO anon;

-- exhibition_schedule_registrations: restrict anon
DROP POLICY IF EXISTS "Anyone can see registration counts" ON public.exhibition_schedule_registrations;
CREATE POLICY "Authenticated can view schedule registrations"
ON public.exhibition_schedule_registrations FOR SELECT TO authenticated
USING (true);
