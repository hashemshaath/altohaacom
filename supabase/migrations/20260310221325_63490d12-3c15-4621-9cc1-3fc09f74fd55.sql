
-- Crawler visits: real-time detection of bot/crawler activity
CREATE TABLE public.seo_crawler_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  crawler_name TEXT NOT NULL,
  crawler_type TEXT DEFAULT 'search_engine',
  user_agent TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_crawler_visits_created ON public.seo_crawler_visits (created_at DESC);
CREATE INDEX idx_seo_crawler_visits_crawler ON public.seo_crawler_visits (crawler_name, created_at DESC);

ALTER TABLE public.seo_crawler_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on seo_crawler_visits"
  ON public.seo_crawler_visits FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read seo_crawler_visits"
  ON public.seo_crawler_visits FOR SELECT TO authenticated
  USING (public.is_admin_user());

-- Tracked keywords: monitor SERP rankings
CREATE TABLE public.seo_tracked_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  keyword_ar TEXT,
  target_page TEXT,
  search_engine TEXT DEFAULT 'google',
  country_code TEXT DEFAULT 'SA',
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_seo_keywords_active ON public.seo_tracked_keywords (is_active, keyword);

ALTER TABLE public.seo_tracked_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_tracked_keywords"
  ON public.seo_tracked_keywords FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Keyword ranking history
CREATE TABLE public.seo_keyword_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.seo_tracked_keywords(id) ON DELETE CASCADE,
  position INTEGER,
  search_engine TEXT DEFAULT 'google',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_keyword_history_keyword ON public.seo_keyword_history (keyword_id, checked_at DESC);

ALTER TABLE public.seo_keyword_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_keyword_history"
  ON public.seo_keyword_history FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Indexing status: track which pages are indexed
CREATE TABLE public.seo_indexing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL,
  status TEXT DEFAULT 'unknown',
  last_submitted_at TIMESTAMP WITH TIME ZONE,
  last_indexed_at TIMESTAMP WITH TIME ZONE,
  submitted_to TEXT[] DEFAULT '{}',
  coverage_state TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_indexing_status ON public.seo_indexing_status (status, path);

ALTER TABLE public.seo_indexing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_indexing_status"
  ON public.seo_indexing_status FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Enable realtime for crawler visits
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_crawler_visits;
