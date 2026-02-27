
-- Feature definitions table
CREATE TABLE public.membership_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'profile_tab',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tier-feature mapping (which features each tier gets)
CREATE TABLE public.membership_feature_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id UUID NOT NULL REFERENCES public.membership_features(id) ON DELETE CASCADE,
  tier TEXT NOT NULL, -- 'basic', 'professional', 'enterprise'
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_id, tier)
);

-- Per-user overrides (grant or revoke specific features)
CREATE TABLE public.membership_feature_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_id UUID NOT NULL REFERENCES public.membership_features(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  granted_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature_id)
);

-- Enable RLS
ALTER TABLE public.membership_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_feature_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Everyone can read features (needed for frontend gating)
CREATE POLICY "Anyone can read active features"
ON public.membership_features FOR SELECT
USING (true);

CREATE POLICY "Anyone can read tier mappings"
ON public.membership_feature_tiers FOR SELECT
USING (true);

-- Users can read their own overrides
CREATE POLICY "Users can read own overrides"
ON public.membership_feature_overrides FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all overrides
CREATE POLICY "Admins can read all overrides"
ON public.membership_feature_overrides FOR SELECT
USING (public.is_admin_user());

-- Admin write policies
CREATE POLICY "Admins can manage features"
ON public.membership_features FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can manage tier mappings"
ON public.membership_feature_tiers FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can manage overrides"
ON public.membership_feature_overrides FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Seed default features
INSERT INTO public.membership_features (code, name, name_ar, category, icon, sort_order) VALUES
-- Profile tabs
('tab_competitions', 'Competitions Tab', 'تبويب المسابقات', 'profile_tab', 'Trophy', 1),
('tab_membership', 'Membership Tab', 'تبويب العضوية', 'profile_tab', 'Crown', 2),
('tab_wallet', 'Wallet Tab', 'تبويب المحفظة', 'profile_tab', 'Wallet', 3),
('tab_orders', 'Orders Tab', 'تبويب الطلبات', 'profile_tab', 'ShoppingBag', 4),
('tab_referrals', 'Referrals Tab', 'تبويب الإحالات', 'profile_tab', 'Gift', 5),
('tab_invoices', 'Invoices Tab', 'تبويب الفواتير', 'profile_tab', 'FileText', 6),
('tab_analytics', 'Analytics Tab', 'تبويب الإحصائيات', 'profile_tab', 'BarChart3', 7),
('tab_social_links', 'Social Links Tab', 'تبويب الروابط', 'profile_tab', 'Link2', 8),
('tab_favorites', 'Favorites Tab', 'تبويب المفضلة', 'profile_tab', 'Heart', 9),
('tab_following', 'Following Tab', 'تبويب المتابعون', 'profile_tab', 'Users', 10),
('tab_achievements', 'Achievements Tab', 'تبويب الإنجازات', 'profile_tab', 'Award', 11),
('tab_customize', 'Profile Customization', 'تخصيص الملف', 'profile_tab', 'Sparkles', 12),
-- Profile header features
('feature_cover_image', 'Cover Image', 'صورة الغلاف', 'profile_header', 'Image', 20),
('feature_verification_badge', 'Verification Badge', 'شارة التحقق', 'profile_header', 'BadgeCheck', 21),
('feature_qr_code', 'QR Code', 'رمز QR', 'profile_header', 'QrCode', 22),
('feature_custom_badges', 'Custom Badges', 'شارات مخصصة', 'profile_header', 'Award', 23),
-- Community features
('feature_posts', 'Create Posts', 'إنشاء منشورات', 'community', 'PenSquare', 30),
('feature_stories', 'Stories', 'القصص', 'community', 'Camera', 31),
('feature_messaging', 'Direct Messaging', 'الرسائل المباشرة', 'community', 'MessageCircle', 32),
('feature_live_sessions', 'Live Sessions', 'الجلسات المباشرة', 'community', 'Video', 33),
('feature_polls', 'Polls', 'استطلاعات الرأي', 'community', 'BarChart', 34);

-- Seed tier mappings: Basic gets limited, Professional gets most, Enterprise gets all
-- Basic tier
INSERT INTO public.membership_feature_tiers (feature_id, tier, is_enabled)
SELECT id, 'basic', true FROM public.membership_features WHERE code IN (
  'tab_membership', 'tab_wallet', 'tab_orders', 'tab_favorites', 'tab_following',
  'feature_posts', 'feature_messaging'
);
INSERT INTO public.membership_feature_tiers (feature_id, tier, is_enabled)
SELECT id, 'basic', false FROM public.membership_features WHERE code NOT IN (
  'tab_membership', 'tab_wallet', 'tab_orders', 'tab_favorites', 'tab_following',
  'feature_posts', 'feature_messaging'
);

-- Professional tier
INSERT INTO public.membership_feature_tiers (feature_id, tier, is_enabled)
SELECT id, 'professional', true FROM public.membership_features WHERE code IN (
  'tab_competitions', 'tab_membership', 'tab_wallet', 'tab_orders', 'tab_referrals',
  'tab_invoices', 'tab_analytics', 'tab_social_links', 'tab_favorites', 'tab_following',
  'tab_achievements', 'feature_cover_image', 'feature_qr_code',
  'feature_posts', 'feature_stories', 'feature_messaging', 'feature_polls'
);
INSERT INTO public.membership_feature_tiers (feature_id, tier, is_enabled)
SELECT id, 'professional', false FROM public.membership_features WHERE code NOT IN (
  'tab_competitions', 'tab_membership', 'tab_wallet', 'tab_orders', 'tab_referrals',
  'tab_invoices', 'tab_analytics', 'tab_social_links', 'tab_favorites', 'tab_following',
  'tab_achievements', 'feature_cover_image', 'feature_qr_code',
  'feature_posts', 'feature_stories', 'feature_messaging', 'feature_polls'
);

-- Enterprise tier - everything enabled
INSERT INTO public.membership_feature_tiers (feature_id, tier, is_enabled)
SELECT id, 'enterprise', true FROM public.membership_features;

-- Security definer function to check feature access without RLS recursion
CREATE OR REPLACE FUNCTION public.user_has_feature(p_user_id UUID, p_feature_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override BOOLEAN;
  v_tier TEXT;
  v_enabled BOOLEAN;
  v_feature_active BOOLEAN;
BEGIN
  -- Check if feature is active
  SELECT is_active INTO v_feature_active FROM membership_features WHERE code = p_feature_code;
  IF v_feature_active IS NULL OR NOT v_feature_active THEN RETURN FALSE; END IF;

  -- Check user override first
  SELECT granted INTO v_override
  FROM membership_feature_overrides mfo
  JOIN membership_features mf ON mf.id = mfo.feature_id
  WHERE mfo.user_id = p_user_id AND mf.code = p_feature_code
    AND (mfo.expires_at IS NULL OR mfo.expires_at > now())
  LIMIT 1;
  IF v_override IS NOT NULL THEN RETURN v_override; END IF;

  -- Get user's membership tier
  SELECT COALESCE(membership_tier, 'basic') INTO v_tier FROM profiles WHERE user_id = p_user_id;

  -- Check tier mapping
  SELECT mft.is_enabled INTO v_enabled
  FROM membership_feature_tiers mft
  JOIN membership_features mf ON mf.id = mft.feature_id
  WHERE mf.code = p_feature_code AND mft.tier = v_tier;

  RETURN COALESCE(v_enabled, FALSE);
END;
$$;
