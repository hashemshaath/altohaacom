
-- Page views tracking for SEO analytics
CREATE TABLE public.seo_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  session_id TEXT,
  user_id UUID,
  duration_seconds INTEGER,
  is_bounce BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_seo_page_views_path ON public.seo_page_views(path, created_at DESC);
CREATE INDEX idx_seo_page_views_created ON public.seo_page_views(created_at DESC);
CREATE INDEX idx_seo_page_views_session ON public.seo_page_views(session_id);

-- SEO crawl/indexing status tracking
CREATE TABLE public.seo_crawl_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_url TEXT,
  search_engine TEXT,
  status TEXT DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_crawl_log_created ON public.seo_crawl_log(created_at DESC);

-- Allow anonymous inserts for page view tracking (public analytics)
ALTER TABLE public.seo_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_crawl_log ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (anonymous tracking)
CREATE POLICY "Anyone can insert page views" ON public.seo_page_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can read page views
CREATE POLICY "Admins can read page views" ON public.seo_page_views
  FOR SELECT TO authenticated USING (public.is_admin_user());

-- Only admins can manage crawl log
CREATE POLICY "Admins can manage crawl log" ON public.seo_crawl_log
  FOR ALL TO authenticated USING (public.is_admin_user());
