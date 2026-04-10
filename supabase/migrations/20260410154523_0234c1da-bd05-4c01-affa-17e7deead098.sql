
-- Drop remaining public policies on activity tables
DROP POLICY IF EXISTS "Anyone can view competition judges" ON public.competition_judges;
CREATE POLICY "Authenticated can view competition judges"
ON public.competition_judges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.event_comment_likes;
CREATE POLICY "Authenticated can view comment likes"
ON public.event_comment_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view interactions" ON public.exhibition_session_interactions;
CREATE POLICY "Authenticated can view session interactions"
ON public.exhibition_session_interactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view likes" ON public.exhibition_social_likes;
CREATE POLICY "Authenticated can view social likes"
ON public.exhibition_social_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view attendees" ON public.live_session_attendees;

DROP POLICY IF EXISTS "Anyone can view participations" ON public.entity_competition_participations;

-- Clean up SEO duplicate+public policies
DROP POLICY IF EXISTS "seo_models_select" ON public.seo_ai_models;
DROP POLICY IF EXISTS "Admins can read AI models" ON public.seo_ai_models;
DROP POLICY IF EXISTS "Admins can view AI models" ON public.seo_ai_models;
CREATE POLICY "Admins can view seo_ai_models"
ON public.seo_ai_models FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "seo_sources_select" ON public.seo_content_sources;
DROP POLICY IF EXISTS "Admins can read content sources" ON public.seo_content_sources;
DROP POLICY IF EXISTS "Admins can view content sources" ON public.seo_content_sources;
CREATE POLICY "Admins can view seo_content_sources"
ON public.seo_content_sources FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "seo_fields_select" ON public.seo_translatable_fields;
DROP POLICY IF EXISTS "Admins can read translatable fields" ON public.seo_translatable_fields;
DROP POLICY IF EXISTS "Admins can view translatable fields" ON public.seo_translatable_fields;
CREATE POLICY "Admins can view seo_translatable_fields"
ON public.seo_translatable_fields FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
