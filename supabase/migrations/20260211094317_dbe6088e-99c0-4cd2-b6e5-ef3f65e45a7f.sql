
-- User behavior tracking for ad retargeting and interest profiling
CREATE TABLE public.ad_user_behaviors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'page_view', -- page_view, click, search, engagement, scroll_depth
  page_url TEXT,
  page_category TEXT, -- competitions, exhibitions, articles, recipes, shop, etc.
  entity_id TEXT, -- ID of the entity being viewed/interacted with
  entity_type TEXT, -- competition, exhibition, article, product, etc.
  metadata JSONB DEFAULT '{}',
  device_type TEXT,
  browser TEXT,
  country TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_user_behaviors ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (anonymous tracking)
CREATE POLICY "Anyone can insert behavior events"
  ON public.ad_user_behaviors FOR INSERT
  WITH CHECK (true);

-- Only admins can read behavior data
CREATE POLICY "Admins can read behavior data"
  ON public.ad_user_behaviors FOR SELECT
  USING (public.is_admin(auth.uid()));

-- User interest profiles aggregated from behaviors
CREATE TABLE public.ad_user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_category TEXT NOT NULL, -- equipment, competitions, recipes, education, etc.
  score NUMERIC DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, interest_category)
);

ALTER TABLE public.ad_user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interests"
  ON public.ad_user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage interests"
  ON public.ad_user_interests FOR ALL
  USING (public.is_admin(auth.uid()));

-- Allow upserts for interest scoring
CREATE POLICY "Insert own interests"
  ON public.ad_user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own interests"
  ON public.ad_user_interests FOR UPDATE
  USING (auth.uid() = user_id);

-- Google integration settings
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type TEXT NOT NULL, -- google_analytics, google_ads, google_tag_manager, facebook_pixel
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(integration_type)
);

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integration settings"
  ON public.integration_settings FOR ALL
  USING (public.is_admin(auth.uid()));

-- Enable realtime for behavior tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_user_behaviors;

-- Add indexes for performance
CREATE INDEX idx_ad_behaviors_user ON public.ad_user_behaviors(user_id);
CREATE INDEX idx_ad_behaviors_session ON public.ad_user_behaviors(session_id);
CREATE INDEX idx_ad_behaviors_category ON public.ad_user_behaviors(page_category);
CREATE INDEX idx_ad_behaviors_created ON public.ad_user_behaviors(created_at DESC);
CREATE INDEX idx_ad_impressions_created ON public.ad_impressions(created_at DESC);
CREATE INDEX idx_ad_clicks_created ON public.ad_clicks(created_at DESC);
CREATE INDEX idx_ad_interests_user ON public.ad_user_interests(user_id, interest_category);
