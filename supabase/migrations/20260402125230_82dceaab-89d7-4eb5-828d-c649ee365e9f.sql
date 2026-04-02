
-- ================================================================
-- RBAC OVERHAUL: Scoped Role-Based Access Control
-- ================================================================

-- ─── 1. CORE AUTH FUNCTIONS (restrict to supervisor only) ───

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'supervisor'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  );
$$;

-- ─── 2. NEW SCOPED AUTHORIZATION FUNCTIONS ───

CREATE OR REPLACE FUNCTION public.is_content_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('supervisor', 'content_writer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_competition_organizer(p_competition_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.competitions
    WHERE id = p_competition_id AND organizer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_exhibition_organizer(p_exhibition_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exhibitions
    WHERE id = p_exhibition_id
    AND (created_by = auth.uid() OR organizer_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.exhibition_organizers
    WHERE exhibition_id = p_exhibition_id AND organizer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_organizer_role()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'organizer'
  );
$$;

-- ─── 3. CONTENT TABLE POLICIES (add content_writer access) ───

CREATE POLICY "Content managers can manage articles"
  ON public.articles FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage article tags"
  ON public.article_tags FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage content categories"
  ON public.content_categories FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage content tags"
  ON public.content_tags FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can view audit logs"
  ON public.content_audit_log FOR SELECT TO authenticated
  USING (public.is_content_manager());

CREATE POLICY "Content managers can manage entities"
  ON public.culinary_entities FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage establishments"
  ON public.establishments FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage FAQs"
  ON public.faqs FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage hero slides"
  ON public.hero_slides FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage homepage sections"
  ON public.homepage_sections FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage homepage blocks"
  ON public.homepage_blocks FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage homepage sponsors"
  ON public.homepage_sponsors FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage knowledge articles"
  ON public.knowledge_articles FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage knowledge categories"
  ON public.knowledge_categories FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage knowledge resources"
  ON public.knowledge_resources FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage masterclasses"
  ON public.masterclasses FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage masterclass modules"
  ON public.masterclass_modules FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage masterclass lessons"
  ON public.masterclass_lessons FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage media"
  ON public.media_library FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage translations"
  ON public.translation_keys FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage predefined categories"
  ON public.predefined_categories FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage partner logos"
  ON public.partner_logos FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage testimonials"
  ON public.testimonials FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_audits"
  ON public.seo_audits FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_audit_issues"
  ON public.seo_audit_issues FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_backlinks"
  ON public.seo_backlinks FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_competitors"
  ON public.seo_competitors FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_crawl_log"
  ON public.seo_crawl_log FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can view seo_crawler_visits"
  ON public.seo_crawler_visits FOR SELECT TO authenticated
  USING (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_indexing_status"
  ON public.seo_indexing_status FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_keyword_history"
  ON public.seo_keyword_history FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can view seo_page_views"
  ON public.seo_page_views FOR SELECT TO authenticated
  USING (public.is_content_manager());

CREATE POLICY "Content managers can manage seo_tracked_keywords"
  ON public.seo_tracked_keywords FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can view seo_web_vitals"
  ON public.seo_web_vitals FOR SELECT TO authenticated
  USING (public.is_content_manager());

CREATE POLICY "Content managers can manage countries"
  ON public.countries FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can manage languages"
  ON public.platform_languages FOR ALL TO authenticated
  USING (public.is_content_manager()) WITH CHECK (public.is_content_manager());

CREATE POLICY "Content managers can view subscribers"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.is_content_manager());

-- ─── 4. COMPETITION TABLE POLICIES (organizer ownership) ───

CREATE POLICY "Organizers manage own competition rounds"
  ON public.competition_rounds FOR ALL TO authenticated
  USING (public.is_competition_organizer(competition_id))
  WITH CHECK (public.is_competition_organizer(competition_id));

CREATE POLICY "Organizers manage own competition schedule"
  ON public.competition_schedule_slots FOR ALL TO authenticated
  USING (public.is_competition_organizer(competition_id))
  WITH CHECK (public.is_competition_organizer(competition_id));

CREATE POLICY "Organizers manage own competition sponsors"
  ON public.competition_sponsors FOR ALL TO authenticated
  USING (public.is_competition_organizer(competition_id))
  WITH CHECK (public.is_competition_organizer(competition_id));

CREATE POLICY "Organizers manage own blind codes"
  ON public.blind_judging_codes FOR ALL TO authenticated
  USING (public.is_competition_organizer(competition_id))
  WITH CHECK (public.is_competition_organizer(competition_id));

CREATE POLICY "Organizers manage own round participants"
  ON public.round_participants FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.competition_rounds cr
    JOIN public.competitions c ON c.id = cr.competition_id
    WHERE cr.id = round_participants.round_id AND c.organizer_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.competition_rounds cr
    JOIN public.competitions c ON c.id = cr.competition_id
    WHERE cr.id = round_participants.round_id AND c.organizer_id = auth.uid()
  ));

CREATE POLICY "Organizers view own competition feedback"
  ON public.competition_feedback FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.competition_registrations cr
    JOIN public.competitions c ON c.id = cr.competition_id
    WHERE cr.id = competition_feedback.registration_id AND c.organizer_id = auth.uid()
  ));

CREATE POLICY "Organizers view own competition portfolios"
  ON public.competition_portfolio_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_portfolio_entries.competition_id AND c.organizer_id = auth.uid()
  ));

-- ─── 5. EXHIBITION TABLE POLICIES (organizer ownership) ───

CREATE POLICY "Organizers manage own exhibitions"
  ON public.exhibitions FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(id))
  WITH CHECK (public.is_exhibition_organizer(id));

CREATE POLICY "Organizers manage own exhibition booths"
  ON public.exhibition_booths FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition agenda"
  ON public.exhibition_agenda_items FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition media"
  ON public.exhibition_media FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition officials"
  ON public.exhibition_officials FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition schedule"
  ON public.exhibition_schedule_items FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own ticket types"
  ON public.exhibition_ticket_types FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition tickets"
  ON public.exhibition_tickets FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition documents"
  ON public.exhibition_documents FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition organizers"
  ON public.exhibition_organizers FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own exhibition sponsors"
  ON public.exhibition_sponsors FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own volunteer tasks"
  ON public.exhibition_volunteer_tasks FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own volunteers"
  ON public.exhibition_volunteers FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own sponsor packages"
  ON public.exhibition_sponsor_packages FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own cooking sessions"
  ON public.exhibition_cooking_sessions FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers manage own discount codes"
  ON public.exhibition_discount_codes FOR ALL TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id))
  WITH CHECK (public.is_exhibition_organizer(exhibition_id));

CREATE POLICY "Organizers view own exhibition reviews"
  ON public.exhibition_reviews FOR SELECT TO authenticated
  USING (public.is_exhibition_organizer(exhibition_id));

-- ─── 6. AUDIT LOGGING ENHANCEMENT ───

CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_actions (admin_id, action_type, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_ARGV[0],
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit trigger on site_settings
CREATE TRIGGER audit_site_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access('site_settings');

-- Audit trigger on invoices
CREATE TRIGGER audit_invoice_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access('invoice_management');
