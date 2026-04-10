
-- 2. chef_schedule_events: secure public view (correct columns)
DROP VIEW IF EXISTS public.chef_schedule_events_public;
CREATE VIEW public.chef_schedule_events_public WITH (security_invoker = on) AS
SELECT
  id, chef_id, title, title_ar, description, description_ar,
  event_type, start_date, end_date, all_day,
  location, location_ar, venue, venue_ar, city, country_code,
  visibility, color, status, priority, tags,
  organizer, organizer_ar, participation_type, participation_type_ar,
  program_name, program_name_ar, channel_name, channel_name_ar,
  broadcast_type, media_url, linked_entity_id, linked_entity_type,
  show_details_publicly, is_recurring, recurrence_rule, recurrence_end_date,
  parent_event_id, timezone, created_at, updated_at
FROM public.chef_schedule_events
WHERE visibility = 'public';

GRANT SELECT ON public.chef_schedule_events_public TO anon, authenticated;

-- 3. company_role_assignments: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view company role assignments" ON public.company_role_assignments;
DROP POLICY IF EXISTS "Anyone can view company role assignments" ON public.company_role_assignments;
DROP POLICY IF EXISTS "Authenticated users can view role assignments" ON public.company_role_assignments;

CREATE POLICY "Company members can view role assignments"
ON public.company_role_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_contacts cc
    WHERE cc.company_id = company_role_assignments.company_id
    AND cc.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- 4. qr_codes: admin-only INSERT
DROP POLICY IF EXISTS "Users can create QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated can create QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated users can insert qr_codes" ON public.qr_codes;

CREATE POLICY "Admins can create QR codes"
ON public.qr_codes FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.is_admin(auth.uid())
);

-- 5. membership_feature_usage: admin-only INSERT
DROP POLICY IF EXISTS "Users can insert feature usage" ON public.membership_feature_usage;
DROP POLICY IF EXISTS "Authenticated can insert feature usage" ON public.membership_feature_usage;
DROP POLICY IF EXISTS "Authenticated users can insert membership_feature_usage" ON public.membership_feature_usage;

CREATE POLICY "Admins can insert feature usage"
ON public.membership_feature_usage FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 6. certificate_verifications: admin-only INSERT
DROP POLICY IF EXISTS "Users can insert verification records" ON public.certificate_verifications;
DROP POLICY IF EXISTS "Authenticated can insert verification records" ON public.certificate_verifications;
DROP POLICY IF EXISTS "Authenticated users can insert certificate_verifications" ON public.certificate_verifications;
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificate_verifications;

CREATE POLICY "Admins can insert verification records"
ON public.certificate_verifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 7. content_moderation_log: admin-only INSERT
DROP POLICY IF EXISTS "Users can insert moderation logs" ON public.content_moderation_log;
DROP POLICY IF EXISTS "Authenticated can insert moderation logs" ON public.content_moderation_log;
DROP POLICY IF EXISTS "Authenticated users can insert content_moderation_log" ON public.content_moderation_log;

CREATE POLICY "Admins can insert moderation logs"
ON public.content_moderation_log FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));
