
-- Benefit limits per tier (null limit = unlimited)
CREATE TABLE public.membership_benefit_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier TEXT NOT NULL,
  benefit_code TEXT NOT NULL,
  benefit_name TEXT NOT NULL,
  benefit_name_ar TEXT,
  icon_name TEXT DEFAULT 'Zap',
  monthly_limit INTEGER, -- null = unlimited
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tier, benefit_code)
);

ALTER TABLE public.membership_benefit_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read benefit limits"
  ON public.membership_benefit_limits FOR SELECT USING (true);

-- Seed with sample limits
INSERT INTO membership_benefit_limits (tier, benefit_code, benefit_name, benefit_name_ar, icon_name, monthly_limit, category, sort_order) VALUES
  -- Basic
  ('basic', 'posts', 'Posts per month', 'المنشورات شهرياً', 'FileText', 10, 'content', 1),
  ('basic', 'stories', 'Stories per month', 'القصص شهرياً', 'Camera', 5, 'content', 2),
  ('basic', 'recipes', 'Recipes per month', 'الوصفات شهرياً', 'ChefHat', 3, 'content', 3),
  ('basic', 'messages', 'Messages per month', 'الرسائل شهرياً', 'MessageSquare', 50, 'engagement', 4),
  ('basic', 'competitions', 'Competition entries', 'المشاركة في المسابقات', 'Trophy', 1, 'activity', 5),
  ('basic', 'live_sessions', 'Live sessions', 'الجلسات المباشرة', 'Video', 0, 'activity', 6),
  ('basic', 'social_links', 'Bio link pages', 'صفحات الروابط', 'Link', 1, 'tools', 7),
  -- Professional
  ('professional', 'posts', 'Posts per month', 'المنشورات شهرياً', 'FileText', 50, 'content', 1),
  ('professional', 'stories', 'Stories per month', 'القصص شهرياً', 'Camera', 30, 'content', 2),
  ('professional', 'recipes', 'Recipes per month', 'الوصفات شهرياً', 'ChefHat', 20, 'content', 3),
  ('professional', 'messages', 'Messages per month', 'الرسائل شهرياً', 'MessageSquare', 500, 'engagement', 4),
  ('professional', 'competitions', 'Competition entries', 'المشاركة في المسابقات', 'Trophy', 5, 'activity', 5),
  ('professional', 'live_sessions', 'Live sessions', 'الجلسات المباشرة', 'Video', 3, 'activity', 6),
  ('professional', 'social_links', 'Bio link pages', 'صفحات الروابط', 'Link', 3, 'tools', 7),
  -- Enterprise
  ('enterprise', 'posts', 'Posts per month', 'المنشورات شهرياً', 'FileText', NULL, 'content', 1),
  ('enterprise', 'stories', 'Stories per month', 'القصص شهرياً', 'Camera', NULL, 'content', 2),
  ('enterprise', 'recipes', 'Recipes per month', 'الوصفات شهرياً', 'ChefHat', NULL, 'content', 3),
  ('enterprise', 'messages', 'Messages per month', 'الرسائل شهرياً', 'MessageSquare', NULL, 'engagement', 4),
  ('enterprise', 'competitions', 'Competition entries', 'المشاركة في المسابقات', 'Trophy', NULL, 'activity', 5),
  ('enterprise', 'live_sessions', 'Live sessions', 'الجلسات المباشرة', 'Video', NULL, 'activity', 6),
  ('enterprise', 'social_links', 'Bio link pages', 'صفحات الروابط', 'Link', NULL, 'tools', 7);
