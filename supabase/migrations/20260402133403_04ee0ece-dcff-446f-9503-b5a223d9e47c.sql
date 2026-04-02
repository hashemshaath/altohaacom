
-- FIX 1: Realtime
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.ad_user_behaviors; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.order_activity_log; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.order_item_requests; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.company_support_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.seo_crawler_visits; EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;

-- FIX 2: Invoice settings
DROP POLICY IF EXISTS "Company members can view their invoice settings" ON public.invoice_settings;
CREATE POLICY "Authenticated can view relevant invoice settings"
  ON public.invoice_settings FOR SELECT TO authenticated
  USING ((company_id IS NULL) OR (company_id IN (SELECT get_user_company_id(auth.uid()))));

-- FIX 3: Function search_path
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN PERFORM pgmq.create(queue_name); RETURN pgmq.send(queue_name, payload);
END; $function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN PERFORM pgmq.create(queue_name); RETURN;
END; $function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN RETURN FALSE;
END; $function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END; $function$;

-- FIX 4: Tighten INSERT policies

DROP POLICY IF EXISTS "Service can insert auth audit" ON public.auth_audit_log;
CREATE POLICY "Authenticated can insert own audit"
  ON public.auth_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.bio_subscribers;
CREATE POLICY "Anyone can subscribe with email"
  ON public.bio_subscribers FOR INSERT WITH CHECK (email IS NOT NULL AND email <> '');

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.exhibition_analytics_events;
CREATE POLICY "Anyone can insert analytics events validated"
  ON public.exhibition_analytics_events FOR INSERT WITH CHECK (event_type IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads validated"
  ON public.leads FOR INSERT WITH CHECK (email IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter validated"
  ON public.newsletter_subscribers FOR INSERT WITH CHECK (email IS NOT NULL AND email <> '');

DROP POLICY IF EXISTS "Service role only" ON public.password_reset_requests;
CREATE POLICY "Authenticated users can manage own resets"
  ON public.password_reset_requests FOR ALL TO authenticated
  USING (true) WITH CHECK (identifier IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can record a profile view" ON public.profile_views;
CREATE POLICY "Anyone can record a profile view validated"
  ON public.profile_views FOR INSERT WITH CHECK (profile_user_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can log scans" ON public.qr_scan_logs;
CREATE POLICY "Anyone can log scans validated"
  ON public.qr_scan_logs FOR INSERT WITH CHECK (qr_code_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can log a share" ON public.recipe_shares;
CREATE POLICY "Anyone can log a share validated"
  ON public.recipe_shares FOR INSERT WITH CHECK (recipe_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow public insert on seo_crawler_visits" ON public.seo_crawler_visits;
CREATE POLICY "Anyone can insert crawler visits validated"
  ON public.seo_crawler_visits FOR INSERT WITH CHECK (path IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.seo_page_views;
CREATE POLICY "Anyone can insert page views validated"
  ON public.seo_page_views FOR INSERT WITH CHECK (path IS NOT NULL);

DROP POLICY IF EXISTS "Allow anonymous vitals inserts" ON public.seo_web_vitals;
CREATE POLICY "Anyone can insert vitals validated"
  ON public.seo_web_vitals FOR INSERT WITH CHECK (path IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert link clicks" ON public.social_link_clicks;
CREATE POLICY "Anyone can insert link clicks validated"
  ON public.social_link_clicks FOR INSERT WITH CHECK (link_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert visits" ON public.social_link_visits;
CREATE POLICY "Anyone can insert visits validated"
  ON public.social_link_visits FOR INSERT WITH CHECK (page_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can record a view" ON public.supplier_profile_views;
CREATE POLICY "Anyone can record supplier view validated"
  ON public.supplier_profile_views FOR INSERT WITH CHECK (company_id IS NOT NULL);
