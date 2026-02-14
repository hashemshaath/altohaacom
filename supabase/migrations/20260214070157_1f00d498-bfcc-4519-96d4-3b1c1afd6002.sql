
-- ============================================
-- REFERRAL & POINTS VIRAL GROWTH SYSTEM
-- ============================================

-- 1. Referral codes table - one per user
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  custom_slug TEXT UNIQUE,
  total_invites_sent INTEGER NOT NULL DEFAULT 0,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Referral invitations - individual invites sent
CREATE TABLE public.referral_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_phone TEXT,
  channel TEXT NOT NULL DEFAULT 'link',
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clicked_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Referral conversions - successful signups
CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.referral_invitations(id),
  points_awarded_referrer INTEGER NOT NULL DEFAULT 0,
  points_awarded_referred INTEGER NOT NULL DEFAULT 0,
  conversion_type TEXT NOT NULL DEFAULT 'signup',
  metadata JSONB DEFAULT '{}',
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- 4. Referral milestones - tiered rewards config
CREATE TABLE public.referral_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  required_referrals INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'points',
  reward_value INTEGER NOT NULL DEFAULT 0,
  reward_description TEXT,
  reward_description_ar TEXT,
  badge_icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. User milestone achievements
CREATE TABLE public.user_milestone_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.referral_milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, milestone_id)
);

-- 6. Points rewards catalog
CREATE TABLE public.points_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'discount',
  reward_value JSONB NOT NULL DEFAULT '{}',
  image_url TEXT,
  stock INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Points redemptions
CREATE TABLE public.points_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.points_rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  redemption_code TEXT,
  fulfilled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Points earning rules
CREATE TABLE public.points_earning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  action_label TEXT NOT NULL,
  action_label_ar TEXT,
  points INTEGER NOT NULL,
  max_per_day INTEGER,
  max_per_user INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Points ledger - all point transactions
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  description_ar TEXT,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Referral link clicks tracking
CREATE TABLE public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referer_url TEXT,
  platform TEXT,
  country TEXT,
  device_type TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestone_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_earning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Referral codes: users see their own, anyone can look up by code
CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referral code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referral code" ON public.referral_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all referral codes" ON public.referral_codes FOR SELECT USING (public.is_admin_user());

-- Referral invitations
CREATE POLICY "Users can view own invitations" ON public.referral_invitations FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can insert own invitations" ON public.referral_invitations FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Admins can view all invitations" ON public.referral_invitations FOR SELECT USING (public.is_admin_user());

-- Referral conversions
CREATE POLICY "Users can view own conversions" ON public.referral_conversions FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "Admins can view all conversions" ON public.referral_conversions FOR SELECT USING (public.is_admin_user());

-- Milestones: public read
CREATE POLICY "Anyone can view milestones" ON public.referral_milestones FOR SELECT USING (true);
CREATE POLICY "Admins can manage milestones" ON public.referral_milestones FOR ALL USING (public.is_admin_user());

-- User milestone achievements
CREATE POLICY "Users can view own achievements" ON public.user_milestone_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_milestone_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.user_milestone_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Points rewards: public read
CREATE POLICY "Anyone can view rewards" ON public.points_rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON public.points_rewards FOR ALL USING (public.is_admin_user());

-- Points redemptions
CREATE POLICY "Users can view own redemptions" ON public.points_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.points_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points earning rules: public read
CREATE POLICY "Anyone can view earning rules" ON public.points_earning_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage earning rules" ON public.points_earning_rules FOR ALL USING (public.is_admin_user());

-- Points ledger
CREATE POLICY "Users can view own ledger" ON public.points_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all ledger" ON public.points_ledger FOR SELECT USING (public.is_admin_user());

-- Referral clicks: insert by anyone (for tracking), view by code owner
CREATE POLICY "Anyone can insert clicks" ON public.referral_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view clicks" ON public.referral_clicks FOR SELECT USING (public.is_admin_user());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Auto-create referral code for new users
CREATE OR REPLACE FUNCTION public.auto_create_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.user_id, public.generate_referral_code())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_referral_code();

-- Award points function
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance from wallet
  SELECT COALESCE(points_balance, 0) INTO v_current_balance
  FROM user_wallets WHERE user_id = p_user_id;

  v_new_balance := v_current_balance + p_points;

  -- Update wallet points balance
  UPDATE user_wallets SET points_balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  -- Also update profile loyalty_points
  UPDATE profiles SET loyalty_points = v_new_balance
  WHERE user_id = p_user_id;

  -- Insert ledger entry
  INSERT INTO points_ledger (user_id, action_type, points, balance_after, description, description_ar, reference_type, reference_id)
  VALUES (p_user_id, p_action_type, p_points, v_new_balance, p_description, p_description_ar, p_reference_type, p_reference_id);

  RETURN v_new_balance;
END;
$$;

-- ============================================
-- SEED DEFAULT MILESTONES
-- ============================================

INSERT INTO public.referral_milestones (name, name_ar, description, description_ar, required_referrals, reward_type, reward_value, reward_description, reward_description_ar, badge_icon, sort_order) VALUES
('First Steps', 'الخطوة الأولى', 'Invite your first friend', 'قم بدعوة أول صديق', 1, 'points', 50, '50 bonus points', '50 نقطة إضافية', '🌱', 1),
('Growing Network', 'شبكة نامية', 'Invite 5 friends', 'قم بدعوة 5 أصدقاء', 5, 'points', 200, '200 bonus points', '200 نقطة إضافية', '🌿', 2),
('Community Builder', 'بانٍ للمجتمع', 'Invite 10 friends', 'قم بدعوة 10 أصدقاء', 10, 'membership_upgrade', 1, 'Free Professional membership for 1 month', 'عضوية احترافية مجانية لمدة شهر', '🏗️', 3),
('Influencer', 'مؤثر', 'Invite 25 friends', 'قم بدعوة 25 صديقاً', 25, 'points', 1000, '1000 bonus points + store discount', '1000 نقطة + خصم في المتجر', '⭐', 4),
('Ambassador', 'سفير', 'Invite 50 friends', 'قم بدعوة 50 صديقاً', 50, 'membership_upgrade', 3, 'Free Professional membership for 3 months', 'عضوية احترافية مجانية لـ 3 أشهر', '🏆', 5),
('Legend', 'أسطورة', 'Invite 100 friends', 'قم بدعوة 100 صديق', 100, 'membership_upgrade', 12, 'Free Enterprise membership for 1 year', 'عضوية مؤسسية مجانية لسنة كاملة', '👑', 6);

-- ============================================
-- SEED DEFAULT EARNING RULES
-- ============================================

INSERT INTO public.points_earning_rules (action_type, action_label, action_label_ar, points, max_per_day) VALUES
('referral_signup', 'Friend signs up', 'صديق يسجل', 100, NULL),
('referral_first_competition', 'Referral joins competition', 'المُحال يشارك في مسابقة', 200, NULL),
('daily_login', 'Daily login', 'تسجيل دخول يومي', 5, 1),
('profile_complete', 'Complete profile', 'إكمال الملف الشخصي', 50, NULL),
('competition_register', 'Register for competition', 'التسجيل في مسابقة', 30, NULL),
('competition_win', 'Win a competition', 'الفوز بمسابقة', 500, NULL),
('leave_review', 'Leave a review', 'كتابة مراجعة', 15, 3),
('share_content', 'Share content', 'مشاركة محتوى', 10, 5),
('complete_masterclass', 'Complete masterclass', 'إكمال دورة', 100, NULL),
('first_purchase', 'First shop purchase', 'أول عملية شراء', 75, NULL);

-- ============================================
-- SEED DEFAULT REWARDS CATALOG
-- ============================================

INSERT INTO public.points_rewards (name, name_ar, description, description_ar, category, points_cost, reward_type, reward_value, sort_order) VALUES
('10% Store Discount', 'خصم 10% من المتجر', 'Get 10% off your next purchase', 'احصل على خصم 10% على مشترياتك القادمة', 'discount', 200, 'discount', '{"percentage": 10}', 1),
('25% Store Discount', 'خصم 25% من المتجر', 'Get 25% off your next purchase', 'احصل على خصم 25% على مشترياتك القادمة', 'discount', 500, 'discount', '{"percentage": 25}', 2),
('Free Masterclass Access', 'دخول مجاني للدورة', 'Access any masterclass for free', 'ادخل أي دورة مجاناً', 'access', 800, 'access', '{"type": "masterclass"}', 3),
('Professional Membership (1 Month)', 'عضوية احترافية (شهر)', 'Upgrade to Professional for 1 month', 'ترقية إلى عضوية احترافية لمدة شهر', 'membership', 1500, 'membership_upgrade', '{"tier": "professional", "months": 1}', 4),
('Expert Consultation (30 min)', 'استشارة خبير (30 دقيقة)', 'Book a 30-minute session with an expert chef', 'احجز جلسة 30 دقيقة مع شيف خبير', 'consultation', 1000, 'consultation', '{"duration_minutes": 30}', 5),
('Digital Gift Card (50 SAR)', 'بطاقة هدية رقمية (50 ريال)', 'Receive a 50 SAR digital gift card', 'احصل على بطاقة هدية رقمية بقيمة 50 ريال', 'gift', 2000, 'gift_card', '{"amount": 50, "currency": "SAR"}', 6);

-- Indexes
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX idx_referral_invitations_referrer ON public.referral_invitations(referrer_id);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
CREATE INDEX idx_points_ledger_user ON public.points_ledger(user_id);
CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code_id);
CREATE INDEX idx_points_redemptions_user ON public.points_redemptions(user_id);
