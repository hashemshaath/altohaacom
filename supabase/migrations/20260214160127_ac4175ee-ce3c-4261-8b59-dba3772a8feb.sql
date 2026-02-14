
-- =============================================
-- 1. Abandoned Carts Tracking
-- =============================================
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  cart_source TEXT DEFAULT 'shop',
  recovery_status TEXT DEFAULT 'abandoned',
  recovery_email_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carts" ON public.abandoned_carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carts" ON public.abandoned_carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own carts" ON public.abandoned_carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all carts" ON public.abandoned_carts FOR SELECT USING (public.is_admin_user());

CREATE INDEX idx_abandoned_carts_user ON public.abandoned_carts(user_id);
CREATE INDEX idx_abandoned_carts_status ON public.abandoned_carts(recovery_status);
CREATE INDEX idx_abandoned_carts_created ON public.abandoned_carts(created_at DESC);

-- =============================================
-- 2. User Engagement Scores
-- =============================================
CREATE TABLE public.user_engagement_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  engagement_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  social_score INTEGER DEFAULT 0,
  purchase_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  engagement_tier TEXT DEFAULT 'cold',
  churn_risk TEXT DEFAULT 'low',
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_engagement_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score" ON public.user_engagement_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all scores" ON public.user_engagement_scores FOR SELECT USING (public.is_admin_user());
CREATE POLICY "Admins can manage scores" ON public.user_engagement_scores FOR ALL USING (public.is_admin_user());

-- =============================================
-- 3. Marketing Tracking Configuration (stores GA4, GTM, Ads IDs)
-- =============================================
CREATE TABLE public.marketing_tracking_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  tracking_id TEXT,
  is_active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_tracking_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active configs" ON public.marketing_tracking_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage configs" ON public.marketing_tracking_config FOR ALL USING (public.is_admin_user());

-- Seed default platforms
INSERT INTO public.marketing_tracking_config (platform, tracking_id, is_active) VALUES
  ('google_analytics_4', NULL, false),
  ('google_tag_manager', NULL, false),
  ('google_ads', NULL, false),
  ('meta_pixel', NULL, false),
  ('tiktok_pixel', NULL, false),
  ('snapchat_pixel', NULL, false);

-- =============================================
-- 4. Lifecycle Automation Triggers
-- =============================================
CREATE TABLE public.lifecycle_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  trigger_event TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  action_type TEXT NOT NULL DEFAULT 'notification',
  template_slug TEXT,
  channels TEXT[] DEFAULT ARRAY['in_app'],
  conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lifecycle_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage triggers" ON public.lifecycle_triggers FOR ALL USING (public.is_admin_user());
CREATE POLICY "Anyone can read active triggers" ON public.lifecycle_triggers FOR SELECT USING (is_active = true);

-- Seed default lifecycle triggers
INSERT INTO public.lifecycle_triggers (name, name_ar, trigger_event, delay_minutes, action_type, channels) VALUES
  ('Welcome New User', 'ترحيب بمستخدم جديد', 'user_signup', 0, 'notification', ARRAY['in_app', 'email']),
  ('Profile Incomplete Reminder', 'تذكير بإكمال الملف', 'profile_incomplete', 1440, 'notification', ARRAY['in_app', 'email']),
  ('Abandoned Cart Recovery', 'استرداد سلة مهجورة', 'cart_abandoned', 60, 'notification', ARRAY['in_app', 'email']),
  ('Inactive User Re-engagement', 'إعادة تفاعل مستخدم خامل', 'user_inactive_7d', 10080, 'notification', ARRAY['in_app', 'email']),
  ('Post-Purchase Follow-up', 'متابعة بعد الشراء', 'order_completed', 2880, 'notification', ARRAY['in_app']),
  ('Competition Registration Reminder', 'تذكير بالتسجيل في مسابقة', 'competition_upcoming', 4320, 'notification', ARRAY['in_app', 'email']),
  ('New Follower Thank You', 'شكر متابع جديد', 'new_follower_milestone', 0, 'notification', ARRAY['in_app']),
  ('Points Earned Celebration', 'احتفال بالنقاط المكتسبة', 'points_milestone', 0, 'notification', ARRAY['in_app']);

-- =============================================
-- 5. Conversion Events Tracking
-- =============================================
CREATE TABLE public.conversion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_value DECIMAL(10,2),
  currency TEXT DEFAULT 'SAR',
  source TEXT,
  medium TEXT,
  campaign TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view conversions" ON public.conversion_events FOR SELECT USING (public.is_admin_user());
CREATE POLICY "Authenticated can insert conversions" ON public.conversion_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Public can insert conversions" ON public.conversion_events FOR INSERT WITH CHECK (true);

CREATE INDEX idx_conversion_events_name ON public.conversion_events(event_name);
CREATE INDEX idx_conversion_events_user ON public.conversion_events(user_id);
CREATE INDEX idx_conversion_events_created ON public.conversion_events(created_at DESC);

-- Update trigger for abandoned_carts
CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_scores_updated_at
  BEFORE UPDATE ON public.user_engagement_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_config_updated_at
  BEFORE UPDATE ON public.marketing_tracking_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lifecycle_triggers_updated_at
  BEFORE UPDATE ON public.lifecycle_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
