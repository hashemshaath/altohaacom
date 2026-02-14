
-- Bonus campaigns table for time-limited point multiplier events
CREATE TABLE public.bonus_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'multiplier', -- 'multiplier', 'bonus_points', 'specific_action'
  multiplier DECIMAL DEFAULT 2, -- e.g., 2x points
  bonus_points INTEGER DEFAULT 0, -- flat bonus on top
  target_actions TEXT[] DEFAULT '{}', -- specific action_types affected, empty = all
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  banner_color TEXT DEFAULT 'primary',
  badge_text TEXT DEFAULT 'BONUS',
  badge_text_ar TEXT DEFAULT 'مكافأة',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bonus_campaigns ENABLE ROW LEVEL SECURITY;

-- Everyone can read active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON public.bonus_campaigns FOR SELECT
  USING (is_active = true AND starts_at <= now() AND ends_at >= now());

-- Admins can manage
CREATE POLICY "Admins can manage campaigns"
  ON public.bonus_campaigns FOR ALL
  USING (public.is_admin_user());

-- Referral tiered bonus config table
CREATE TABLE public.referral_tier_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_referrals INTEGER NOT NULL,
  max_referrals INTEGER,
  bonus_points INTEGER NOT NULL DEFAULT 0, -- extra points per referral at this tier
  label TEXT NOT NULL,
  label_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referral_tier_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tier bonuses"
  ON public.referral_tier_bonuses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tier bonuses"
  ON public.referral_tier_bonuses FOR ALL
  USING (public.is_admin_user());

-- Insert tier bonus data
INSERT INTO public.referral_tier_bonuses (min_referrals, max_referrals, bonus_points, label, label_ar) VALUES
  (1, 5, 0, 'Starter', 'المبتدئ'),
  (6, 15, 50, 'Growing', 'النامي'),
  (16, 30, 100, 'Influencer', 'المؤثر'),
  (31, 50, 150, 'Ambassador', 'السفير'),
  (51, NULL, 200, 'Legend', 'الأسطورة');
