
-- Phase 24: Advanced Loyalty & Rewards

-- 1. Loyalty Tiers
CREATE TABLE public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  icon_emoji TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#6366f1',
  benefits JSONB DEFAULT '[]'::jsonb,
  multiplier NUMERIC(3,2) DEFAULT 1.00,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tiers" ON public.loyalty_tiers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage tiers" ON public.loyalty_tiers FOR ALL USING (public.is_admin_user());

INSERT INTO public.loyalty_tiers (name, name_ar, slug, min_points, icon_emoji, color, multiplier, sort_order, benefits) VALUES
  ('Bronze', 'برونزي', 'bronze', 0, '🥉', '#CD7F32', 1.00, 1, '["Basic access","Community features"]'::jsonb),
  ('Silver', 'فضي', 'silver', 500, '🥈', '#C0C0C0', 1.25, 2, '["Priority support","Early access to events"]'::jsonb),
  ('Gold', 'ذهبي', 'gold', 2000, '🥇', '#FFD700', 1.50, 3, '["VIP events","Exclusive content","15% shop discount"]'::jsonb),
  ('Platinum', 'بلاتيني', 'platinum', 5000, '💎', '#E5E4E2', 2.00, 4, '["Personal account manager","Free event tickets","25% shop discount"]'::jsonb),
  ('Diamond', 'ماسي', 'diamond', 15000, '👑', '#B9F2FF', 3.00, 5, '["All benefits","Lifetime membership","Custom badge","50% shop discount"]'::jsonb);

-- 2. Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon_emoji TEXT DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  challenge_type TEXT NOT NULL DEFAULT 'one_time',
  target_action TEXT NOT NULL,
  target_count INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  reward_badge TEXT,
  difficulty TEXT DEFAULT 'easy',
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage challenges" ON public.challenges FOR ALL USING (public.is_admin_user());

INSERT INTO public.challenges (title, title_ar, icon_emoji, category, target_action, target_count, reward_points, difficulty, sort_order) VALUES
  ('Complete Your Profile', 'أكمل ملفك الشخصي', '👤', 'general', 'profile_complete', 1, 100, 'easy', 1),
  ('First Competition', 'أول مسابقة', '🏆', 'competition', 'first_competition', 1, 250, 'medium', 2),
  ('Social Butterfly', 'فراشة اجتماعية', '🦋', 'social', 'follow_users', 10, 150, 'easy', 3),
  ('Review Master', 'خبير التقييم', '✍️', 'engagement', 'write_reviews', 5, 200, 'medium', 4),
  ('Streak Champion', 'بطل المواظبة', '🔥', 'engagement', 'daily_login', 30, 500, 'hard', 5),
  ('Competition Winner', 'فائز في المسابقة', '🥇', 'competition', 'win_gold', 1, 1000, 'legendary', 6),
  ('Community Star', 'نجم المجتمع', '⭐', 'social', 'post_reactions', 50, 300, 'medium', 7),
  ('Referral Pro', 'محترف الإحالة', '🤝', 'general', 'refer_friends', 5, 500, 'hard', 8);

-- 3. User Challenges
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage user_challenges" ON public.user_challenges FOR ALL USING (public.is_admin_user());

-- 4. Rewards Catalog
CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  points_cost INTEGER NOT NULL,
  stock INTEGER,
  max_per_user INTEGER DEFAULT 1,
  min_tier TEXT DEFAULT 'bronze',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  redemption_instructions TEXT,
  redemption_instructions_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active rewards" ON public.rewards_catalog FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage rewards" ON public.rewards_catalog FOR ALL USING (public.is_admin_user());

INSERT INTO public.rewards_catalog (name, name_ar, category, points_cost, min_tier, is_featured, sort_order) VALUES
  ('10% Shop Discount', 'خصم 10% على المتجر', 'discount', 200, 'bronze', true, 1),
  ('Free Event Ticket', 'تذكرة فعالية مجانية', 'experience', 500, 'silver', true, 2),
  ('Premium Badge', 'شارة مميزة', 'merchandise', 300, 'bronze', false, 3),
  ('1 Month Pro Membership', 'عضوية احترافية لشهر', 'membership', 2000, 'gold', true, 4),
  ('Chef Masterclass Access', 'حضور ماستركلاس طبخ', 'experience', 1500, 'gold', true, 5);

-- 5. Reward Redemptions
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  redemption_code TEXT,
  notes TEXT,
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create redemptions" ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage redemptions" ON public.reward_redemptions FOR ALL USING (public.is_admin_user());

-- 6. User Streaks
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL DEFAULT 'daily_login',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, streak_type)
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage streaks" ON public.user_streaks FOR ALL USING (public.is_admin_user());

-- 7. Add loyalty_tier to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze';
