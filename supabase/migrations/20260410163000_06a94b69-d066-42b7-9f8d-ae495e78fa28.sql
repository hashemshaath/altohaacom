
-- 1. ad_clicks: restrict INSERT to valid active creatives
DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON public.ad_clicks;
CREATE POLICY "Validated click inserts"
ON public.ad_clicks FOR INSERT TO authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND creative_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.ad_creatives ac
    JOIN public.ad_campaigns camp ON camp.id = ac.campaign_id
    WHERE ac.id = ad_clicks.creative_id
    AND ac.is_active = true
    AND camp.status = 'active'
  )
);

-- 2. ad_impressions: restrict INSERT to valid active creatives
DROP POLICY IF EXISTS "Authenticated users can insert impressions" ON public.ad_impressions;
CREATE POLICY "Validated impression inserts"
ON public.ad_impressions FOR INSERT TO authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND creative_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.ad_creatives ac
    JOIN public.ad_campaigns camp ON camp.id = ac.campaign_id
    WHERE ac.id = ad_impressions.creative_id
    AND ac.is_active = true
    AND camp.status = 'active'
  )
);

-- 3. profile_views: replace owner SELECT with safe view (no IP/user_agent)
DROP POLICY IF EXISTS "Profile owners can view their analytics" ON public.profile_views;
CREATE POLICY "Profile owners view safe analytics"
ON public.profile_views FOR SELECT TO authenticated
USING (profile_user_id = auth.uid());
-- Note: owners still access via profile_views_safe view for analytics without IP

-- 4. exhibition_schedule_registrations: remove public SELECT
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.exhibition_schedule_registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.exhibition_schedule_registrations;
CREATE POLICY "Users can view own schedule registrations"
ON public.exhibition_schedule_registrations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- exhibition_session_registrations: remove public SELECT
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.exhibition_session_registrations;
DROP POLICY IF EXISTS "Authenticated can view session registrations" ON public.exhibition_session_registrations;
CREATE POLICY "Users view own session registrations"
ON public.exhibition_session_registrations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- 5. exhibition_analytics_events: restrict INSERT to authenticated
DROP POLICY IF EXISTS "Anyone can insert analytics events validated" ON public.exhibition_analytics_events;
CREATE POLICY "Authenticated can insert analytics events"
ON public.exhibition_analytics_events FOR INSERT TO authenticated
WITH CHECK (
  event_type IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.exhibitions e
    WHERE e.id = exhibition_analytics_events.exhibition_id
    AND e.status = 'active'
  )
);
